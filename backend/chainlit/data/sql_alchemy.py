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
from azure.storage.filedatalake import FileSystemClient, ContentSettings
from chainlit.context import context
from chainlit.logger import logger
from chainlit.data import BaseDataLayer, queue_until_user_message
from chainlit.user import User, PersistedUser, UserDict
from chainlit.types import Feedback, FeedbackDict, Pagination, ThreadDict, ThreadFilter
from chainlit.element import ElementDict
from literalai import PageInfo, PaginatedResponse

from chainlit.step import StepDict

if TYPE_CHECKING:
    from chainlit.element import Element
    from chainlit.step import StepDict

class SQLAlchemyDataLayer(BaseDataLayer):
    def __init__(self, conn_info, ssl_require=False):
        self.conn_info = conn_info
        ssl_args = {}
        if ssl_require:
            # Create an SSL context to require an SSL connection
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            ssl_args['ssl'] = ssl_context
        self.engine = create_async_engine(self.conn_info, connect_args=ssl_args)
        self.async_session = sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)
        self.all_user_threads = None
        self.thread_update_lock = asyncio.Lock()
        self.step_update_lock = asyncio.Lock()

    async def add_blob_storage_client(self, blob_storage_client, access_token: Optional[str]):
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
            except Exception as e:
                await session.rollback()
                logger.warn(f"An unexpected error occurred: {e}")

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
        logger.info(f"Postgres: get_user, identifier={identifier}")
        query = "SELECT * FROM users WHERE identifier = :identifier"
        parameters = {"identifier": identifier}
        result = await self.execute_sql(query=query, parameters=parameters)
        if result:
            user_data = result[0]
            return PersistedUser(**user_data)
        return None
        
    async def create_user(self, user: 'User') -> Optional[PersistedUser]:
        logger.info(f"Postgres: create_user, user_identifier={user.identifier}")
        existing_user: Optional['PersistedUser'] = await self.get_user(user.identifier)
        user_dict = {
            "identifier": str(user.identifier),
            "metadata": json.dumps(user.metadata) or {}
            }
        if not existing_user: # create the user
            logger.info("Postgres: create_user, creating the user")
            user_dict['id'] = str(uuid.uuid4())
            user_dict['createdAt'] = await self.get_current_timestamp()
            query = "INSERT INTO users (id, identifier, createdAt, metadata) VALUES (:id, :identifier, :createdAt, :metadata)"
            await self.execute_sql(query=query, parameters=user_dict)
        else: # update the user
            query = """UPDATE users SET "metadata" = :metadata WHERE "identifier" = :identifier"""
            await self.execute_sql(query=query, parameters=user_dict) # We want to update the metadata
        # _user = await self.get_user(user.identifier)
        return await self.get_user(user.identifier)
        
    ###### Threads ######
    async def get_thread_author(self, thread_id: str) -> Optional[str]:
        logger.info(f"Postgres: get_thread_author, thread_id={thread_id}")
        query = """SELECT u.* FROM threads t JOIN users u ON t."user_id" = u."id" WHERE t."id" = :id"""
        parameters = {"id": thread_id}
        result = await self.execute_sql(query=query, parameters=parameters)
        return result[0].get('identifier') if result else None
    
    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        logger.info(f"Postgres: get_thread, thread_id={thread_id}")
        user_identifier = await self.get_thread_author(thread_id=thread_id)
        if not self.all_user_threads:
            await self.get_all_user_threads(user_identifier=user_identifier)
        for thread in self.all_user_threads:
            if thread['id'] == thread_id:
                return thread
        return None

    async def update_thread(self, thread_id: str, name: Optional[str] = None, user_id: Optional[str] = None, metadata: Optional[Dict] = None, tags: Optional[List[str]] = None):
        logger.info(f"Postgres: update_thread, thread_id={thread_id}")
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
        logger.info(f"Postgres: delete_thread, thread_id={thread_id}")
        query = """DELETE FROM threads WHERE "id" = :id"""
        parameters = {"id": thread_id}
        await self.execute_sql(query=query, parameters=parameters)
    
    async def list_threads(self, pagination: Pagination, filters: ThreadFilter) -> PaginatedResponse[ThreadDict]:
        logger.info(f"Postgres: list_threads, pagination={pagination}, filters={filters}")
        if not filters.userIdentifier:
            raise ValueError("userIdentifier is required")
        if not self.all_user_threads:
            await self.get_all_user_threads(user_identifier=filters.userIdentifier)

        search_keyword = filters.search.lower() if filters.search else None
        feedback_value = int(filters.feedback) if filters.feedback else None

        filtered_threads = []
        for thread in self.all_user_threads:
            if search_keyword or feedback_value:
                keyword_match = any(search_keyword in step['output'].lower() for step in thread['steps'] if 'output' in step) if search_keyword else True
                feedback_match = any(step.get('feedback', {}).get('value') == feedback_value for step in thread['steps']) if feedback_value else True
                if keyword_match and feedback_match:
                    filtered_threads.append(thread)
            else:
                filtered_threads.append(thread)

        # Apply pagination
        start = int(pagination.cursor) if pagination.cursor else 0
        end = start + pagination.first
        paginated_threads = filtered_threads[start:end]

        has_next_page = len(filtered_threads) > end
        end_cursor = paginated_threads[-1]['id'] if paginated_threads else None

        return PaginatedResponse(
            pageInfo=PageInfo(hasNextPage=has_next_page, endCursor=end_cursor),
            data=paginated_threads
        )
    
    ###### Steps ######
    @queue_until_user_message()
    async def create_step(self, step_dict: 'StepDict'):
        logger.info(f"Postgres: create_step, step_id={step_dict.get('id')}")
        async with self.thread_update_lock:  # Wait for update_thread
            pass
        async with self.step_update_lock:  # Acquire the lock before updating the step
            step_dict['showInput'] = str(step_dict.get('showInput', '')).lower() if 'showInput' in step_dict else None
            parameters = {key: value for key, value in step_dict.items() if value is not None}  # Remove keys with None values

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
        logger.info(f"Postgres: update_step, step_id={step_dict.get('id')}")
        await self.create_step(step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        logger.info(f"Postgres: delete_step, step_id={step_id}")
        query = """DELETE FROM steps WHERE "id" = :id"""
        parameters = {"id": step_id}
        await self.execute_sql(query=query, parameters=parameters)
    
    ###### Feedback ######
    async def upsert_feedback(self, feedback: Feedback) -> str:
        logger.info(f"Postgres: upsert_feedback, feedback_id={feedback.id}")
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
        logger.info(f"Postgres: create_element, element_id = {element.id}")
        async with self.thread_update_lock:
            pass  # We just want to ensure update_thread is done; no further action is needed here.
        async with self.step_update_lock:
            pass  # We just want to ensure create_step is done; no further action is needed here.
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
        element_dict = {k: json.dumps(v) if isinstance(v, (dict, list)) else v for k, v in element_dict.items()}

        columns = ', '.join(f'"{column}"' for column in element_dict.keys())
        placeholders = ', '.join(f':{column}' for column in element_dict.keys())
        query = f"INSERT INTO elements ({columns}) VALUES ({placeholders})"
        await self.execute_sql(query=query, parameters=element_dict)

    @queue_until_user_message()
    async def delete_element(self, element_id: str):
        logger.info(f"Postgres: delete_element, element_id={element_id}")
        query = """DELETE FROM elements WHERE "id" = :id"""
        parameters = {"id": element_id}
        await self.execute_sql(query=query, parameters=parameters)

    async def delete_user_session(self, id: str) -> bool:
        return False # Not sure why documentation wants this

    #### NEW OPTIMIZATION ####
    async def get_all_user_threads(self, user_identifier: str):
        """Fetch all user threads and store in self.all_user_threads for fast retrieval"""
        logger.info(f"Postgres: get_all_user_threads, OPTIMIZATION")
        parameters = {"identifier": user_identifier}
        sql_query = """
        SELECT
            t."id" AS thread_id,
            t."createdAt" AS thread_createdat,
            t."name" AS thread_name,
            t."tags" AS thread_tags,
            t."metadata" AS thread_metadata,
            u."id" AS user_id,
            u."identifier" AS user_identifier,
            u."metadata" AS user_metadata,
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
            f."comment" AS feedback_comment,
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
        FROM
            threads t
            LEFT JOIN users u ON t."user_id" = u."id"
            LEFT JOIN steps s ON t."id" = s."threadId"
            LEFT JOIN feedbacks f ON s."id" = f."forId"
            LEFT JOIN elements e ON t."id" = e."threadId"
        WHERE u."identifier" = :identifier
        ORDER BY t."createdAt" DESC, s."start" ASC 
        """
        results = await self.execute_sql(query=sql_query, parameters=parameters)
        threads = []
        for row in results:
            thread_id = row['thread_id']
            thread = next((t for t in threads if t['id'] == thread_id), None)
            if not thread:
                thread = ThreadDict(
                    id=thread_id,
                    createdAt=row['thread_createdat'],
                    name=row['thread_name'],
                    user= UserDict(
                        id=row['user_id'],
                        identifier=row['user_identifier'],
                        metadata=row['user_metadata']
                    ) if row['user_id'] else None,
                    tags=row['thread_tags'],
                    metadata=row['thread_metadata'],
                    steps=[],
                    elements=[]
                )
                threads.append(thread)
            if row['step_id']:
                step = StepDict(
                    id=row['step_id'],
                    name=row['step_name'],
                    type=row['step_type'],
                    threadId=row['step_threadid'],
                    parentId=row['step_parentid'],
                    disableFeedback=row['step_disablefeedback'],
                    streaming=row['step_streaming'],
                    waitForAnswer=row['step_waitforanswer'],
                    isError=row['step_iserror'],
                    metadata=row['step_metadata'],
                    input=None if not row['step_showinput'] else row['step_input'],
                    output=row['step_output'],
                    createdAt=row['step_createdat'],
                    start=row['step_start'],
                    end=row['step_end'],
                    generation=row['step_generation'],
                    showInput=row['step_showinput'],
                    language=row['step_language'],
                    indent=row['step_indent'],
                    feedback= FeedbackDict(
                        value=row['feedback_value'],
                        strategy=row['feedback_strategy'],
                        comment=row['feedback_comment']
                     ) if row['feedback_value'] is not None else None
                )
                thread['steps'].append(step)
            if row['element_id']:
                element = ElementDict(
                    id=row['element_id'],
                    threadId=row['element_threadid'],
                    type=row['element_type'],
                    chainlitKey=row['element_chainlitkey'],
                    url=row['element_url'],
                    objectKey=row['element_objectkey'],
                    name=row['element_name'],
                    display=row['element_display'],
                    size=row['element_size'],
                    language=row['element_language'],
                    page=row['element_page'],
                    forId=row['element_forid'],
                    mime=row['element_mime']
                )
                thread['elements'].append(element)
        self.all_user_threads = threads
