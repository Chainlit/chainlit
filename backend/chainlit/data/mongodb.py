from typing import Dict, List, Optional
import chainlit.data as cl_data
from chainlit.data import BaseDataLayer, BaseStorageClient, queue_until_user_message
from chainlit.step import StepDict
from literalai.helper import utc_now
from motor.motor_asyncio import AsyncIOMotorClient
from chainlit.element import ElementDict
from chainlit.logger import logger
from chainlit.step import StepDict
from chainlit.types import (
    Feedback,
    FeedbackDict,
    PageInfo,
    PaginatedResponse,
    Pagination,
    ThreadDict,
    ThreadFilter,
)
import chainlit as cl
import uuid

class MongoDBDataLayer(BaseDataLayer):
    def __init__(self, mongodb_uri: str, db_name: str):
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.client[db_name]
        self.users = self.db.users
        self.threads = self.db.threads
        

    async def build_indexes(self):

        await self.threads.create_index("id", unique=True)
        await self.users.create_index("identifier", unique=True)
        await self.threads.create_index("steps.id")
        await self.threads.create_index("feedback.id")
        await self.threads.create_index("elements.id")

    ##### Users #####
    async def get_user(self, identifier: str):
        user = await self.users.find_one({"identifier": identifier})
        if user:
            return cl.PersistedUser(id=str(user["id"]), createdAt=user["createdAt"], identifier=user["identifier"])
        return None

    async def create_user(self, user: cl.User):
        result = await self.users.update_one({
            "identifier": user.identifier,
        }, { "$setOnInsert": {
            "id" : user.identifier,
            "createdAt": utc_now()
        }}, upsert=True)
        return cl.PersistedUser(id=str(result.upsertedid), createdAt=utc_now(), identifier=user.identifier)

    ##### Threads #####
    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        update_data = {
        }
        if name:
            update_data["name"] = name
        if metadata:
            update_data["metadata"] = metadata
        if tags:
            update_data["tags"] = tags
        if user_id:
            update_data["user_id"] = user_id

        await self.threads.update_one(
            {"id": thread_id},
            {"$set": update_data,
             "$setOnInsert": {"createdAt": utc_now(), "steps" : []}},
            upsert=True
        )
    
    async def list_threads(
        self, pagination: cl_data.Pagination, filters: cl_data.ThreadFilter
    ) -> cl_data.PaginatedResponse[cl_data.ThreadDict]:
        await self.build_indexes()
        query = {}
        if filters.userId:
            query["user_id"] = filters.userId

        search_keyword = filters.search.lower() if filters.search else None
        if search_keyword:
            query["name"] = {"$regex": search_keyword, "$options": "i"}

        total = await self.threads.count_documents(query)

        threads = await self.threads.find(query).to_list(length=None)

        for thread in threads:
            thread["_id"] = str(thread.pop("_id"))

        return PaginatedResponse(
            data=threads,
            pageInfo=PageInfo(
                hasNextPage=False,
                startCursor=None,
                endCursor=None
            ),
        )

    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        
        thread = await self.threads.find_one({"id": thread_id})
        if thread:
            thread["_id"] = str(thread.pop("_id"))
            thread["steps"] = sorted(thread.get("steps", []), key=lambda x: x["createdAt"])
            return thread
        return None

    async def delete_thread(self, thread_id: str):
        await self.threads.delete_one({"id": thread_id})

    async def get_thread_author(self, thread_id: str):
       
        thread = await self.threads.find_one({"id": thread_id})
        if thread:
           
            print("Thread found with user:" + thread.get("user_id"))
            return thread.get("user_id")
        return None
    
    ##### Steps #####
    @cl_data.queue_until_user_message()
    async def create_step(self, step_dict: StepDict):
        
        thread_id = step_dict.pop("threadId", None)
        if thread_id:

            await self.threads.update_one(
                {"id": thread_id},
                {"$push": {"steps": step_dict}}
            )

    @cl_data.queue_until_user_message()
    async def update_step(self, step_dict: StepDict):
        
        thread_id = step_dict.pop("threadId", None)
        if thread_id:
            await self.threads.update_one(
                {"id": thread_id, "steps.id": step_dict["id"]},
                {"$set": {"steps.$": step_dict}}
            )

    @queue_until_user_message()
    async def delete_step(self, stepid: str):
        await self.threads.update_one(
            {"steps.id": stepid},
            {"$pull": {"steps": {"id": stepid}}}
        )

    
    ###### Feedback ######
    async def upsert_feedback(self, feedback: Feedback) -> str:
        print ("In upsert_feedback :" , feedback)
        feedback.id = feedback.id or str(uuid.uuid4())
        result = await self.threads.update_one(
            {"steps.id": feedback.forId}, 
            {"$set": {"steps.$.feedback" :{
                "id" : feedback.id,
                "forId" : feedback.forId,
                "threadId" : feedback.threadId,
                "value" : feedback.value,
                "comment" : feedback.comment
            }}}
        )
        print(result)
        return str(feedback.id)

    async def delete_feedback(self, feedback_id: str) -> bool:
        result = await self.threads.update_one(
            {"feedback.id": feedback_id},
            {"$pull": {"feedback": {"id": feedback_id}}}
        )
        return result.modified_count > 0
    
    ###### Elements ######
    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        thread_id = element.pop("thread_id", None)
        if thread_id:
            await self.threads.update_one(
                {"id": thread_id},
                {"$push": {"elements": element}}
            )

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        query = {"elements.id": element_id}
        if thread_id:
            query["id"] = thread_id
        await self.threads.update_one(
            query,
            {"$pull": {"elements": {"id": element_id}}}
        )

    async def delete_user_session(self, id: str) -> bool:
        return False  # Not sure why documentation wants this


# Usage:
# cl_data._data_layer = MongoDBDataLayer("mongodb://localhost:27017", "chainlit_db")