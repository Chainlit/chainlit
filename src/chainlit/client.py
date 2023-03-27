from python_graphql_client import GraphqlClient

class GqlClient():
    def __init__(self, access_token: str, url="http://localhost:3000/api/graphql"):
        self.client = GraphqlClient(endpoint=url, headers={"Authorization": access_token})

    def query(self, query, variables={}):
        return self.client.execute(query=query, variables=variables)

    def mutation(self, mutation, variables={}):
        return self.client.execute(query=mutation, variables=variables)
    
    def create_conversation(self, project_id: str, session_id: str):
        mutation = """mutation ($projectId: String!, $sessionId: String!) {
            createConversation(projectId: $projectId, sessionId: $sessionId) {
                id
            }
        }"""
        variables = {"projectId": project_id, "sessionId": session_id}
        return self.mutation(mutation, variables)