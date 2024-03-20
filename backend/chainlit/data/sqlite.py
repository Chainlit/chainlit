import asyncio
import os
import uuid
from datetime import datetime
from typing import Optional, Union, cast

import literalai
from chainlit.data import ChainlitDataLayer
from literalai import (
    ChatGeneration,
    CompletionGeneration,
    FeedbackStrategy,
    PageInfo,
    PaginatedResponse,
)
from literalai.step import StepType
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.future import select
from sqlalchemy.orm import DeclarativeBase

from chainlit import config


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    identifier = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_ = Column(JSON)


class Thread(Base):
    __tablename__ = "thread"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_ = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)


class Step(Base):
    __tablename__ = "step"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String, ForeignKey("thread.id"))
    parent_id = Column(String, ForeignKey("step.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    name = Column(String)
    type = Column(String)
    input = Column(JSON)
    output = Column(JSON)
    generation = Column(JSON)
    metadata_ = Column(JSON)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    step_id = Column(String, ForeignKey("step.id"))
    value = Column(Integer)
    comment = Column(String)
    strategy = Column(String)


class Attachment(Base):
    __tablename__ = "attachment"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String, ForeignKey("thread.id"))
    step_id = Column(String, ForeignKey("step.id"))
    name = Column(String)
    mime = Column(String)
    object_key = Column(String)
    url = Column(String)
    metadata_ = Column(JSON)


class SQLiteClient:
    def __init__(self, db_filepath=None):
        if db_filepath is None or db_filepath == "":
            db_filepath = "chainlit.db"
        normalized_path = self.normalize_db_path(db_filepath)
        os.makedirs(os.path.dirname(normalized_path), exist_ok=True)

        self.engine = create_async_engine(
            f"sqlite+aiosqlite:///{normalized_path}", echo=True
        )
        self.api = API(self.engine)
        asyncio.run(self.create_tables())

    async def create_tables(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    @staticmethod
    def normalize_db_path(db_path):
        abs_path = os.path.abspath(db_path)
        normalized_path = os.path.normpath(abs_path)
        if os.name == "nt":
            normalized_path = normalized_path.replace("\\", "/")
        return normalized_path


class API:
    lock = asyncio.Lock()

    def __init__(self, engine):
        self.async_sessionmaker = async_sessionmaker(
            bind=engine, class_=AsyncSession, expire_on_commit=False
        )

    async def get_user(self, identifier):
        async with self.async_sessionmaker() as session:
            result = await session.execute(
                select(User).filter_by(identifier=identifier)
            )
            user = result.scalars().first()
            if user:
                return literalai.User(
                    id=user.id,
                    identifier=user.identifier,
                    metadata=user.metadata_,
                    created_at=user.created_at.isoformat(),
                )
            return None

    async def create_user(self, identifier, metadata):
        async with self.async_sessionmaker() as session:
            new_user = User(
                id=str(uuid.uuid4()), identifier=identifier, metadata_=metadata
            )
            session.add(new_user)
            await session.commit()
            return literalai.User(
                id=new_user.id,
                identifier=new_user.identifier,
                metadata=new_user.metadata_,
                created_at=new_user.created_at.isoformat(),
            )

    async def update_user(self, id, metadata):
        async with self.async_sessionmaker() as session:
            user = await session.get(User, id)
            if user:
                user.metadata_ = metadata
                await session.commit()
                return literalai.User(
                    id=user.id,
                    identifier=user.identifier,
                    metadata=user.metadata_,
                    created_at=user.created_at.isoformat(),
                )
            return None

    async def create_feedback(self, step_id, value, comment, strategy):
        async with self.async_sessionmaker() as session:
            new_feedback = Feedback(
                id=str(uuid.uuid4()),
                step_id=step_id,
                value=value,
                comment=comment,
                strategy=strategy,
            )
            session.add(new_feedback)
            await session.commit()
            return new_feedback

    async def update_feedback(self, id, update_params):
        async with self.async_sessionmaker() as session:
            feedback = await session.get(Feedback, id)
            if feedback:
                feedback.comment = update_params.comment
                feedback.strategy = update_params.strategy
                feedback.value = update_params.value
                await session.commit()
            return feedback

    async def get_attachment(self, id):
        async with self.async_sessionmaker() as session:
            return await session.get(Attachment, id)

    async def delete_attachment(self, id):
        logger.info(f"###### delete_attachment id {id}")
        async with self.async_sessionmaker() as session:
            attachment = await session.get(Attachment, id)
            if attachment:
                # Delete the attachment if found
                await session.delete(attachment)
                await session.commit()

    async def upload_file(self, content, mime, thread_id):
        return {"object_key": f"projects/todo/threads/{thread_id}/files/todo"}

    async def delete_step(self, id):
        async with self.async_sessionmaker() as session:
            step = await session.get(Step, id)
            if step:
                await session.delete(step)
                await session.commit()
                query = select(Feedback).filter_by(step_id=id)
                result = await session.execute(query)
                feedbacks = result.scalars().all()
                for feedback in feedbacks:
                    await session.delete(feedback)
                    await session.commit()
                query = select(Attachment).filter_by(step_id=id)
                result = await session.execute(query)
                attachments = result.scalars().all()
                for attachment in attachments:
                    await self.delete_attachment(str(attachment.id))

    async def send_steps(self, steps):

        def convert_to_datetime(value):
            if value is None:
                return None
            return datetime.fromisoformat(value.rstrip("Z"))

        async with API.lock:
            async with self.async_sessionmaker() as session:
                async with session.begin():
                    for step_dict in steps:
                        step_id = step_dict.get("id")
                        if "attachments" in step_dict:
                            for attachment_dict in step_dict["attachments"]:
                                attachment = Attachment(
                                    id=attachment_dict.get("id"),
                                    step_id=step_id,
                                    name=attachment_dict.get("name"),
                                    mime=attachment_dict.get("mime"),
                                    object_key=attachment_dict.get("objectKey"),
                                    url=attachment_dict.get("url"),
                                    metadata_=attachment_dict.get("metadata"),
                                )
                                session.add(attachment)
                        else:
                            existing_step = await session.get(Step, step_id)
                            if existing_step:
                                existing_step.end_time = convert_to_datetime(
                                    step_dict.get("endTime")
                                )
                                existing_step.generation = step_dict.get("generation")
                                existing_step.name = step_dict.get("name")
                                existing_step.metadata_.update(
                                    step_dict.get("metadata")
                                )
                                existing_step.input = step_dict.get("input")
                                existing_step.output = step_dict.get("output")
                            else:
                                step = Step(
                                    created_at=convert_to_datetime(
                                        step_dict.get("createdAt")
                                    ),
                                    start_time=convert_to_datetime(
                                        step_dict.get("startTime")
                                    ),
                                    end_time=convert_to_datetime(
                                        step_dict.get("endTime")
                                    ),
                                    generation=step_dict.get("generation"),
                                    id=step_dict.get("id"),
                                    parent_id=step_dict.get("parentId"),
                                    name=step_dict.get("name"),
                                    thread_id=step_dict.get("threadId"),
                                    type=step_dict.get("type"),
                                    metadata_=step_dict.get("metadata"),
                                    input=step_dict.get("input"),
                                    output=step_dict.get("output"),
                                )
                                session.add(step)

    async def get_thread(self, id):
        async with self.async_sessionmaker() as session:
            stmt = select(Thread).filter_by(id=id)
            result = await session.execute(stmt)
            thread = result.scalars().first()
            if thread is None:
                return None
        async with self.async_sessionmaker() as session:
            stmt = select(Step).filter_by(thread_id=id)
            result = await session.execute(stmt)
            thread_steps = result.scalars().all()

        steps = []
        if thread_steps:
            for step in thread_steps:
                if config.ui.hide_cot and step.parent_id:
                    continue
                if not config.features.prompt_playground and step.generation:
                    step.generation = None
                elif step.generation is not None:
                    step.generation = literalai.BaseGeneration.from_dict(
                        step.generation
                    )
                async with self.async_sessionmaker() as session:
                    stmt = select(Attachment).filter(Attachment.step_id == step.id)
                    result = await session.execute(stmt)
                    attachments_ = []
                    attachments = result.scalars().all()
                    for attachment in attachments:
                        attachments_.append(self.attachment_to_attachment(attachment))
                    step.attachments = attachments_
                async with self.async_sessionmaker() as session:
                    stmt = select(Feedback).filter(Feedback.step_id == step.id)
                    result = await session.execute(stmt)
                    feedback = result.scalars().first()
                steps.append(self.step_to_step(step, feedback))
        user = None
        if thread.user_id:
            async with self.async_sessionmaker() as session:
                result = await session.execute(
                    select(User).filter_by(id=thread.user_id)
                )
                persisted_user = result.scalars().first()
            user = literalai.User(
                id=thread.user_id or "",
                identifier=persisted_user.identifier or "",
                metadata=persisted_user.metadata_,
            )

        thread_ = literalai.Thread(
            id=str(thread.id),
            name=str(thread.name) or None,
            steps=steps,
            metadata=thread.metadata_,
            user=user,
            tags=thread.tags,
        )
        thread_.created_at = thread.created_at.isoformat()
        return thread_

    async def delete_thread(self, id):
        async with self.async_sessionmaker() as session:
            thread = await session.get(Thread, id)
            if thread:
                await session.delete(thread)
                await session.commit()
                query = select(Step).filter_by(thread_id=id)
                result = await session.execute(query)
                steps = result.scalars().all()
                for step in steps:
                    await self.delete_step(str(step.id))

    async def list_threads(self, first, after, filters):
        query = (
            select(Thread)
            .join(User)
            .filter_by(identifier=filters.participantsIdentifier.value[0])
        )
        if filters.search:
            query = query.filter(Thread.name.ilike(f"%{filters.search.value}%"))

        if filters.feedbacksValue:
            query = (
                query.join(Step)
                .join(Feedback)
                .filter_by(value=filters.feedbacksValue.value[0])
            )

        if after:
            query = query.offset(after)

        query = query.limit(first)

        async with self.async_sessionmaker() as session:
            result = await session.execute(query)
            threads = result.scalars().all()

        async def convert_thread_to_dict(thread):
            user = None
            if thread.user_id:
                async with self.async_sessionmaker() as session:
                    result = await session.execute(
                        select(User).filter_by(id=thread.user_id)
                    )
                    persisted_user = result.scalars().first()
                user = {
                    "id": thread.user_id or "",
                    "identifier": persisted_user.identifier or "",
                    "metadata": persisted_user.metadata_,
                }
            return {
                "createdAt": thread.created_at.isoformat() or "",
                "id": thread.id,
                "name": thread.name or None,
                "metadata": thread.metadata_,
                "user": user,
                "tags": thread.tags,
            }

        threads_data = [await convert_thread_to_dict(thread) for thread in threads]
        return PaginatedResponse(data=threads_data, pageInfo=PageInfo.from_dict({}))

    async def upsert_thread(self, thread_id, name, participant_id, metadata, tags):
        async with API.lock:
            async with self.async_sessionmaker() as session:
                stmt = select(Thread).filter_by(id=thread_id)
                result = await session.execute(stmt)
                thread = result.scalars().first()
                if thread:
                    if name is not None:
                        thread.name = name
                    if participant_id is not None:
                        thread.user_id = participant_id
                    if metadata is not None:
                        if thread.metadata_:
                            thread.metadata_.update(metadata)
                        else:
                            thread.metadata_ = metadata
                    if tags is not None:
                        thread.tags = tags
                else:
                    thread = Thread(
                        id=thread_id,
                        name=name,
                        user_id=participant_id,
                        metadata_=metadata or {},
                        tags=tags,
                    )
                    session.add(thread)
                await session.commit()

    def step_to_step(self, step: Step, feedback: Feedback) -> "literalai.Step":
        step_ = literalai.Step(
            name=str(step.name),
            type=cast(StepType, str(step.type)),
            id=str(step.id),
            thread_id=str(step.thread_id),
            parent_id=str(step.parent_id),
        )
        step_.metadata = dict(step.metadata_) if step.metadata_ else {}
        step_.input = dict(step.input) if step.input else {}
        step_.output = dict(step.output) if step.output else {}
        step_.start_time = step.start_time.isoformat() if step.start_time else None
        step_.end_time = step.end_time.isoformat() if step.end_time else None
        step_.created_at = step.created_at.isoformat() if step.created_at else None
        step_.generation = (
            cast(Optional[Union[ChatGeneration, CompletionGeneration]], step.generation)
            if step.generation
            else None
        )
        step_.feedback = self.feedback_to_feedback(feedback) if feedback else None
        return step_

    def feedback_to_feedback(self, feedback: Feedback) -> "literalai.Feedback":
        return literalai.Feedback(
            id=str(feedback.id),
            step_id=str(feedback.step_id),
            value=float(feedback.value),
            comment=str(feedback.comment) if feedback.comment else "",
            strategy=cast(FeedbackStrategy, str(feedback.strategy)),
        )

    def attachment_to_attachment(
        self, attachment: Attachment
    ) -> "literalai.Attachment":
        metadata = dict(attachment.metadata_) if attachment.metadata_ else {}
        return literalai.Attachment(
            thread_id=str(attachment.thread_id) if attachment.thread_id else "",
            step_id=str(attachment.step_id),
            metadata=dict(metadata) if metadata else {},
            object_key=str(attachment.object_key) if attachment.object_key else "",
            mime=str(attachment.mime),
            name=str(attachment.name),
            url=str(attachment.url) if attachment.url else "",
            id=str(attachment.id),
        )


class SQLiteDataLayer(ChainlitDataLayer):
    def __init__(self, db_filepath=None):
        super().__init__("dummy", "")
        self.client = SQLiteClient(db_filepath)
