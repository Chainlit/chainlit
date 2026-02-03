from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON, TypeDecorator


class CrossDialectJSON(TypeDecorator):
    """JSON type that uses JSONB on PostgreSQL and JSON on other databases."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(JSON())


class Base(DeclarativeBase):
    """Shared base for all ORM models. Required so Base.metadata.create_all() discovers all tables."""

    pass


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    identifier: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", CrossDialectJSON, nullable=True, default=dict
    )
    createdAt: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    threads: Mapped[list[ThreadModel]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class ThreadModel(Base):
    __tablename__ = "threads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    createdAt: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    userId: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    userIdentifier: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", CrossDialectJSON, nullable=True
    )

    user: Mapped[Optional[UserModel]] = relationship(back_populates="threads")
    steps: Mapped[list[StepModel]] = relationship(
        back_populates="thread", cascade="all, delete-orphan", passive_deletes=True
    )
    elements: Mapped[list[ElementModel]] = relationship(
        back_populates="thread",
        cascade="all, delete-orphan",
        passive_deletes=True,
        foreign_keys="ElementModel.threadId",
    )


class StepModel(Base):
    __tablename__ = "steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    threadId: Mapped[str] = mapped_column(
        String(36), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False
    )
    parentId: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    disableFeedback: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True, default=False
    )
    streaming: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True, default=False
    )
    waitForAnswer: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    isError: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata", CrossDialectJSON, nullable=True
    )
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    input: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    start: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    end: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    generation: Mapped[Optional[dict[str, Any]]] = mapped_column(
        CrossDialectJSON, nullable=True
    )
    showInput: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    indent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    thread: Mapped[ThreadModel] = relationship(back_populates="steps")
    feedbacks: Mapped[list[FeedbackModel]] = relationship(
        back_populates="step", cascade="all, delete-orphan", passive_deletes=True
    )
    elements: Mapped[list[ElementModel]] = relationship(
        back_populates="step",
        cascade="all, delete-orphan",
        passive_deletes=True,
        foreign_keys="ElementModel.forId",
    )


class ElementModel(Base):
    __tablename__ = "elements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    threadId: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("threads.id", ondelete="CASCADE"), nullable=True
    )
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chainlitKey: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    objectKey: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    forId: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("steps.id", ondelete="CASCADE"), nullable=True
    )
    mime: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    props: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    autoPlay: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    playerConfig: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    thread: Mapped[Optional[ThreadModel]] = relationship(
        back_populates="elements", foreign_keys=[threadId]
    )
    step: Mapped[Optional[StepModel]] = relationship(
        back_populates="elements", foreign_keys=[forId]
    )


class FeedbackModel(Base):
    __tablename__ = "feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    forId: Mapped[str] = mapped_column(
        String(36), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False
    )
    threadId: Mapped[str] = mapped_column(String(36), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    step: Mapped[StepModel] = relationship(back_populates="feedbacks")
