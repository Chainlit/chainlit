import uuid
import ssl
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional, Union, TYPE_CHECKING
import aiofiles
import asyncio
from dataclasses import asdict
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from azure.storage.filedatalake import FileSystemClient, ContentSettings  # type: ignore
from chainlit.context import context
from chainlit.logger import logger
from chainlit.data import BaseDataLayer, queue_until_user_message
from chainlit.user import User, PersistedUser, UserDict
from chainlit.types import Feedback, FeedbackDict, Pagination, ThreadDict, ThreadFilter, PageInfo, PaginatedResponse
from chainlit.step import StepDict
from chainlit.element import ElementDict

if TYPE_CHECKING:
    from chainlit.element import Element, ElementDict
    from chainlit.step import StepDict

class SQLAlchemyDataLayer(BaseDataLayer):
    def __init__(self, conninfo, ssl_require=False, user_thread_limit=100):
        self._conninfo = conninfo
        self.user_thread_limit = user_thread_limit
        ssl_args = {}
        if ssl_require:
            # Create an SSL context to require an SSL connection
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            ssl_args['ssl'] = ssl_context
        self.engine = create_async_engine(self._conninfo, connect_args=ssl_args)
        self.async_session = sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)
        self.thread_update_lock = asyncio.Lock()
        self.step_update_lock = asyncio.Lock()

    async def add_blob_storage_client(self, blob_storage_client, access_token: Optional[str]) -> None:
        if isinstance(blob_storage_client, FileSystemClient):
            self.blob_storage_client = blob_storage_client
            self.blob_access_token = access_token
            self.blob_storage_provider = 'Azure'
            logger.info("Azure Data Lake Storage client initialized")
        # Add other checks here for AWS/Google/etc.
        else:
            raise ValueError("The provided blob_storage is not recognized")

    ###### SQL Helpers ######
    async def execute_sql(self, query: str, parameters: dict) -> Union[List[Dict[str, Any]], int, None]:
        parameterized_query = text(query)
        async with self.async_session() as session:
            try:
                await session.begin()
                result = await session.execute(parameterized_query, parameters)
                await session.commit()
                if result.returns_rows:
                    json_result = [dict(row._mapping) for row in result.fetchall()]
                    clean_json_result = self.clean_result(json_result)
                    return clean_json_result
                else:
                    return result.rowcount
            except SQLAlchemyError as e:
                await session.rollback()
                logger.warn(f"An error occurred: {e}")
                return None
            except Exception as e:
                await session.rollback()
                logger.warn(f"An unexpected error occurred: {e}")
                return None

    async def get_current_timestamp(self) -> str:
        return datetime.now(timezone.utc).astimezone().isoformat()
    
    def clean_result(self, obj):
        """Recursively change UUI -> STR and serialize dictionaries"""
        if isinstance(obj, dict):
            for k, v in obj.items():
                obj[k] = self.clean_result(v)
        elif isinstance(obj, list):
            return [self.clean_result(item) for item in obj]
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, dict):
            return json.dumps(obj)
        return obj
              
    ###### User ######
    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        logger.info(f"SQLAlchemy: get_user, identifier={identifier}")
        query = "SELECT * FROM users WHERE identifier = :identifier"
        parameters = {"identifier": identifier}
        result = await self.execute_sql(query=query, parameters=parameters)
        if result and isinstance(result, list):
            user_data = result[0]
            return PersistedUser(**user_data)
        return None
        
    async def create_user(self, user: User) -> Optional[PersistedUser]:
        logger.info(f"SQLAlchemy: create_user, user_identifier={user.identifier}")
        existing_user: Optional['PersistedUser'] = await self.get_user(user.identifier)
        user_dict: Dict[str, Any]  = {
            "identifier": str(user.identifier),
            "metadata": json.dumps(user.metadata) or {}
            }
        if not existing_user: # create the user
            logger.info("SQLAlchemy: create_user, creating the user")
            user_dict['id'] = str(uuid.uuid4())
            user_dict['createdAt'] = await self.get_current_timestamp()
            query = """INSERT INTO users ("id", "identifier", "createdAt", "metadata") VALUES (:id, :identifier, :createdAt, :metadata)"""
            await self.execute_sql(query=query, parameters=user_dict)
        else: # update the user
            query = """UPDATE users SET "metadata" = :metadata WHERE "identifier" = :identifier"""
            await self.execute_sql(query=query, parameters=user_dict) # We want to update the metadata
        return await self.get_user(user.identifier)
        
    ###### Threads ######
    async def get_thread_author(self, thread_id: str) -> str:
        logger.info(f"SQLAlchemy: get_thread_author, thread_id={thread_id}")
        query = """SELECT u.* FROM threads t JOIN users u ON t."user_id" = u."id" WHERE t."id" = :id"""
        parameters = {"id": thread_id}
        result = await self.execute_sql(query=query, parameters=parameters)
        if result and isinstance(result, list) and result[0]:
            author_identifier = result[0].get('identifier')
            if author_identifier is not None:
                return author_identifier
        raise ValueError(f"Author not found for thread_id {thread_id}")
    
    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        logger.info(f"SQLAlchemy: get_thread, thread_id={thread_id}")
        user_identifier = await self.get_thread_author(thread_id=thread_id)
        if user_identifier is None:
            raise ValueError("User identifier not found for the given thread_id")
        user_threads: Optional[List[ThreadDict]] = await self.get_all_user_threads(user_identifier=user_identifier)
        if not user_threads:
            return None
        for thread in user_threads:
            if thread['id'] == thread_id:
                return thread
        return None

    async def update_thread(self, thread_id: str, name: Optional[str] = None, user_id: Optional[str] = None, metadata: Optional[Dict] = None, tags: Optional[List[str]] = None):
        logger.info(f"SQLAlchemy: update_thread, thread_id={thread_id}")
        async with self.thread_update_lock:  # Acquire the lock before updating the thread
            data = {
                "id": thread_id,
                "createdAt": await self.get_current_timestamp() if metadata is None else None,
                "name": name if name is not None else (metadata.get('name') if metadata and 'name' in metadata else None),
                "user_id": user_id,
                "tags": tags,
                "metadata": json.dumps(metadata) if metadata else None,
            }
            parameters = {key: value for key, value in data.items() if value is not None} # Remove keys with None values
            columns = ', '.join(f'"{key}"' for key in parameters.keys())
            values = ', '.join(f':{key}' for key in parameters.keys())
            updates = ', '.join(f'"{key}" = EXCLUDED."{key}"' for key in parameters.keys() if key != 'id')
            query = f"""
                INSERT INTO threads ({columns})
                VALUES ({values})
                ON CONFLICT ("id") DO UPDATE
                SET {updates};
            """
            await self.execute_sql(query=query, parameters=parameters)

    async def delete_thread(self, thread_id: str):
        logger.info(f"SQLAlchemy: delete_thread, thread_id={thread_id}")
        query = """DELETE FROM threads WHERE "id" = :id"""
        parameters = {"id": thread_id}
        await self.execute_sql(query=query, parameters=parameters)
    
    async def list_threads(self, pagination: Pagination, filters: ThreadFilter) -> PaginatedResponse[ThreadDict]:
        logger.info(f"SQLAlchemy: list_threads, pagination={pagination}, filters={filters}")
        if not filters.userIdentifier:
            raise ValueError("userIdentifier is required")
        all_user_threads: List[ThreadDict] = await self.get_all_user_threads(user_identifier=filters.userIdentifier) or []

        search_keyword = filters.search.lower() if filters.search else None
        feedback_value = int(filters.feedback) if filters.feedback else None

        filtered_threads = []
        for thread in all_user_threads:
            keyword_match = True
            feedback_match = True  # Initialize feedback_match to True
            if search_keyword or feedback_value is not None:
                if search_keyword:
                    keyword_match = any(search_keyword in step['output'].lower() for step in thread['steps'] if 'output' in step)
                if feedback_value is not None:
                    feedback_match = False  # Assume no match until found
                    for step in thread['steps']:
                        feedback = step.get('feedback')
                        if feedback and feedback.get('value') == feedback_value:
                            feedback_match = True
                            break
            if keyword_match and feedback_match:
                filtered_threads.append(thread)

        start = 0 # Find the start index using pagination.cursor
        if pagination.cursor:
            for i, thread in enumerate(filtered_threads):
                if thread['id'] == pagination.cursor:
                    start = i + 1
                    break
        end = start + pagination.first
        paginated_threads = filtered_threads[start:end] or []

        has_next_page = len(filtered_threads) > end
        end_cursor = paginated_threads[-1]['id'] if paginated_threads else None

        return PaginatedResponse(
            pageInfo=PageInfo(hasNextPage=has_next_page, endCursor=end_cursor),
            data=paginated_threads
        )
    
    ###### Steps ######
    @queue_until_user_message()
    async def create_step(self, step_dict: 'StepDict'):
        logger.info(f"SQLAlchemy: create_step, step_id={step_dict.get('id')}")
        logger.info(f"SQLAlchemy: name={step_dict.get('name')}, input={step_dict.get('input')}, output={step_dict.get('name')}")
        async with self.thread_update_lock:  # Wait for update_thread
            pass
        async with self.step_update_lock:  # Acquire the lock before updating the step
            step_dict['showInput'] = str(step_dict.get('showInput', '')).lower() if 'showInput' in step_dict else None
            # parameters = {key: value for key, value in step_dict.items() if value is not None}  # Remove keys with None values
            parameters = {key: value for key, value in step_dict.items() if value is not None and not (isinstance(value, dict) and not value)}


            columns = ', '.join(f'"{key}"' for key in parameters.keys())
            values = ', '.join(f':{key}' for key in parameters.keys())
            updates = ', '.join(f'"{key}" = :{key}' for key in parameters.keys() if key != 'id')
            query = f"""
                INSERT INTO steps ({columns})
                VALUES ({values})
                ON CONFLICT (id) DO UPDATE
                SET {updates};
            """
            await self.execute_sql(query=query, parameters=parameters)
    
    @queue_until_user_message()
    async def update_step(self, step_dict: 'StepDict'):
        logger.info(f"SQLAlchemy: update_step, step_id={step_dict.get('id')}")
        await self.create_step(step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        logger.info(f"SQLAlchemy: delete_step, step_id={step_id}")
        query = """DELETE FROM steps WHERE "id" = :id"""
        parameters = {"id": step_id}
        await self.execute_sql(query=query, parameters=parameters)
    
    ###### Feedback ######
    async def upsert_feedback(self, feedback: Feedback) -> str:
        logger.info(f"SQLAlchemy: upsert_feedback, feedback_id={feedback.id}")
        feedback.id = feedback.id or str(uuid.uuid4())
        feedback_dict = asdict(feedback)
        parameters = {key: value for key, value in feedback_dict.items() if value is not None}  # Remove keys with None values

        columns = ', '.join(f'"{key}"' for key in parameters.keys())
        values = ', '.join(f':{key}' for key in parameters.keys())
        updates = ', '.join(f'"{key}" = :{key}' for key in parameters.keys() if key != 'id')
        query = f"""
            INSERT INTO feedbacks ({columns})
            VALUES ({values})
            ON CONFLICT (id) DO UPDATE
            SET {updates};
        """
        await self.execute_sql(query=query, parameters=parameters)
        return feedback.id

    ###### Elements ######
    @queue_until_user_message()
    async def create_element(self, element: 'Element'):
        logger.info(f"SQLAlchemy: create_element, element_id = {element.id}")
        async with self.thread_update_lock:
            pass
        async with self.step_update_lock:
            pass
        if not self.blob_storage_client:
            raise ValueError("No blob_storage_client is configured")
        if not element.for_id:
            return
        element_dict = element.to_dict()
        content: Optional[Union[bytes, str]] = None

        if not element.url:
            if element.path:
                async with aiofiles.open(element.path, "rb") as f:
                    content = await f.read()
            elif element.content:
                content = element.content
            else:
                raise ValueError("Either path or content must be provided")

            context_user = context.session.user
            if not context_user or not getattr(context_user, 'id', None):
                raise ValueError("No valid user in context")

            user_folder = getattr(context_user, 'id', 'unknown')
            object_key = f"{user_folder}/{element.id}" + (f"/{element.name}" if element.name else "")

            if self.blob_storage_provider == 'Azure':
                file_client = self.blob_storage_client.get_file_client(object_key)
                content_type = ContentSettings(content_type=element.mime)
                file_client.upload_data(content, overwrite=True, content_settings=content_type)
                element.url = file_client.url + (self.blob_access_token or '')

        element_dict['url'] = element.url
        element_dict['objectKey'] = object_key if 'object_key' in locals() else None
        element_dict_cleaned = {k: v for k, v in element_dict.items() if v is not None}

        columns = ', '.join(f'"{column}"' for column in element_dict_cleaned.keys())
        placeholders = ', '.join(f':{column}' for column in element_dict_cleaned.keys())
        query = f"INSERT INTO elements ({columns}) VALUES ({placeholders})"
        await self.execute_sql(query=query, parameters=element_dict_cleaned)

    @queue_until_user_message()
    async def delete_element(self, element_id: str):
        logger.info(f"SQLAlchemy: delete_element, element_id={element_id}")
        query = """DELETE FROM elements WHERE "id" = :id"""
        parameters = {"id": element_id}
        await self.execute_sql(query=query, parameters=parameters)

    async def delete_user_session(self, id: str) -> bool:
        return False # Not sure why documentation wants this

    async def get_all_user_threads(self, user_identifier: str) -> Optional[List[ThreadDict]]:
        """Fetch all user threads for fast retrieval, up to self.user_thread_limit"""
        logger.info(f"SQLAlchemy: get_all_user_threads")
        user_threads_query = """
            SELECT
                t."id" AS thread_id,
                t."createdAt" AS thread_createdat,
                t."name" AS thread_name,
                t."tags" AS thread_tags,
                t."metadata" AS thread_metadata,
                u."id" AS user_id,
                u."identifier" AS user_identifier,
                u."metadata" AS user_metadata
            FROM threads t JOIN users u ON t."user_id" = u."id"
            WHERE u."identifier" = :identifier
            ORDER BY t."createdAt" DESC
            LIMIT :limit
        """
        user_threads = await self.execute_sql(query=user_threads_query, parameters={"identifier": user_identifier, "limit": self.user_thread_limit})
        if not isinstance(user_threads, list):
            return None
        thread_ids = "('" + "','".join(map(str, [thread['thread_id'] for thread in user_threads])) + "')"
        if not thread_ids:
            return []
        
        steps_feedbacks_query = f"""
            SELECT
                s."id" AS step_id,
                s."name" AS step_name,
                s."type" AS step_type,
                s."threadId" AS step_threadid,
                s."parentId" AS step_parentid,
                s."disableFeedback" AS step_disablefeedback,
                s."streaming" AS step_streaming,
                s."waitForAnswer" AS step_waitforanswer,
                s."isError" AS step_iserror,
                s."metadata" AS step_metadata,
                s."input" AS step_input,
                s."output" AS step_output,
                s."createdAt" AS step_createdat,
                s."start" AS step_start,
                s."end" AS step_end,
                s."generation" AS step_generation,
                s."showInput" AS step_showinput,
                s."language" AS step_language,
                s."indent" AS step_indent,
                f."value" AS feedback_value,
                f."strategy" AS feedback_strategy,
                f."comment" AS feedback_comment
            FROM steps s LEFT JOIN feedbacks f ON s."id" = f."forId"
            WHERE s."threadId" IN {thread_ids}
            ORDER BY s."createdAt" ASC
        """
        steps_feedbacks = await self.execute_sql(query=steps_feedbacks_query, parameters={})
        
        elements_query = f"""
            SELECT
                e."id" AS element_id,
                e."threadId" as element_threadid,
                e."type" AS element_type,
                e."url" AS element_url,
                e."chainlitKey" AS element_chainlitkey,
                e."objectKey" as element_objectkey,
                e."name" AS element_name,
                e."display" AS element_display,
                e."size" AS element_size,
                e."language" AS element_language,
                e."page" AS element_page,
                e."forId" AS element_forid,
                e."mime" AS element_mime
            FROM elements e
            WHERE e."threadId" IN {thread_ids}
        """
        elements = await self.execute_sql(query=elements_query, parameters={})
        
        # Initialize a dictionary to hold ThreadDict objects keyed by thread_id
        thread_dicts = {}
        # Process threads_users to create initial ThreadDict objects
        for thread in user_threads:
            thread_id = thread['thread_id']
            thread_dicts[thread_id] = ThreadDict(
                id=thread_id,
                createdAt=thread['thread_createdat'],
                name=thread['thread_name'],
                user=UserDict(
                    id=thread['user_id'],
                    identifier=thread['user_identifier'],
                    metadata=thread['user_metadata']
                ),
                tags=thread['thread_tags'],
                metadata=thread['thread_metadata'],
                steps=[],
                elements=[]
            )
        # Process steps_feedbacks to populate the steps in the corresponding ThreadDict
        if isinstance(steps_feedbacks, list):
            for step_feedback in steps_feedbacks:
                thread_id = step_feedback['step_threadid']
                feedback = None
                if step_feedback['feedback_value'] is not None:
                    feedback = FeedbackDict(
                        value=step_feedback['feedback_value'],
                        strategy=step_feedback['feedback_strategy'],
                        comment=step_feedback.get('feedback_comment')
                    )
                step_dict = StepDict(
                    id=step_feedback['step_id'],
                    name=step_feedback['step_name'],
                    type=step_feedback['step_type'],
                    threadId=thread_id,
                    parentId=step_feedback.get('step_parentid'),
                    disableFeedback=step_feedback.get('step_disableFeedback', False),
                    streaming=step_feedback.get('step_streaming', False),
                    waitForAnswer=step_feedback.get('step_waitForAnswer'),
                    isError=step_feedback.get('step_isError'),
                    metadata=step_feedback.get('step_metadata', {}),
                    input=step_feedback.get('step_input', '') if step_feedback['step_showinput'] else None,
                    output=step_feedback.get('step_output', ''),
                    createdAt=step_feedback.get('step_createdAt'),
                    start=step_feedback.get('step_start'),
                    end=step_feedback.get('step_end'),
                    generation=step_feedback.get('step_generation'),
                    showInput=step_feedback.get('step_showInput'),
                    language=step_feedback.get('step_language'),
                    indent=step_feedback.get('step_indent'),
                    feedback=feedback
                )
                # Append the step to the steps list of the corresponding ThreadDict
                thread_dicts[thread_id]['steps'].append(step_dict)

        if isinstance(elements, list):
            for element in elements:
                thread_id = element['element_threadid']
                element_dict = ElementDict(
                    id=element['element_id'],
                    threadId=thread_id,
                    type=element['element_type'],
                    chainlitKey=element.get('element_chainlitKey'),
                    url=element.get('element_url'),
                    objectKey=element.get('element_objectKey'),
                    name=element['element_name'],
                    display=element['element_display'],
                    size=element.get('element_size'),
                    language=element.get('element_language'),
                    page=element.get('element_page'),
                    forId=element.get('element_forId'),
                    mime=element.get('element_mime'),
                )
                thread_dicts[thread_id]['elements'].append(element_dict)   # type: ignore

        return list(thread_dicts.values()) 
