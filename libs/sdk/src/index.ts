import { GraphQLClient } from 'graphql-request';
import { v4 as uuidv4 } from 'uuid';

export type ElementType =
  | 'image'
  | 'avatar'
  | 'text'
  | 'pdf'
  | 'tasklist'
  | 'audio'
  | 'video'
  | 'file';
export type ElementDisplay = 'inline' | 'side' | 'page';
export type ElementSize = 'small' | 'medium' | 'large';

export type Role = 'USER' | 'ADMIN' | 'OWNER' | 'ANONYMOUS';
export type Provider =
  | 'credentials'
  | 'header'
  | 'github'
  | 'google'
  | 'azure-ad'
  | 'okta'
  | 'auth0';

export interface IAppUser {
  username: string;
  role?: Role;
  tags?: string[];
  image?: string;
  provider?: Provider;
}

export interface IPersistedAppUser extends IAppUser {
  id: string;
  createdAt: number;
}

export interface IMessage {
  conversationId?: string;
  id: string;
  createdAt?: number;
  content: string;
  author: string;
  prompt?: any;
  language?: string;
  parentId?: string;
  indent?: number;
  authorIsUser?: boolean;
  waitForAnswer?: boolean;
  isError?: boolean;
  humanFeedback?: number;
  disableHumanFeedback?: boolean;
}

export interface IElement {
  id: string;
  conversationId?: string;
  type: ElementType;
  url: string;
  objectKey?: string;
  name: string;
  display: ElementDisplay;
  size?: ElementSize;
  language?: string;
  forIds?: string[];
}

export interface IConversation {
  id?: string;
  createdAt?: number;
  elementCount?: number;
  messageCount?: number;
  appUser?: IAppUser;
  messages: IMessage[];
  elements?: IElement[];
}

export interface IPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface IPaginatedResponse<T> {
  pageInfo: IPageInfo;
  data: T[];
}

export interface IPagination {
  first: number;
  cursor?: string;
}

export interface IConversationFilter {
  feedback?: -1 | 0 | 1;
  username?: string;
  search?: string;
}

class ChainlitGraphQLClient {
  private graphqlClient: GraphQLClient;
  public headers: Record<string, string>;

  constructor(apiKey: string, chainlitServer: string) {
    if (!apiKey) {
      throw new Error(
        'Cannot instantiate Cloud Client without CHAINLIT_API_KEY'
      );
    }

    this.headers = {
      'content-type': 'application/json',
      'x-api-key': apiKey
    };

    const graphqlEndpoint = `${chainlitServer}/api/graphql`;
    this.graphqlClient = new GraphQLClient(graphqlEndpoint, {
      headers: this.headers
    });
  }

  async query(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<any> {
    return this.graphqlClient.request(query, variables);
  }

  async mutation(
    mutation: string,
    variables: Record<string, any> = {}
  ): Promise<any> {
    return this.graphqlClient.request(mutation, variables);
  }
}

export class ChainlitCloudClient extends ChainlitGraphQLClient {
  chainlitServer: string;
  constructor(apiKey: string, chainlitServer = 'https://cloud.chainlit.io') {
    // Remove trailing slash
    chainlitServer = chainlitServer.endsWith('/')
      ? chainlitServer.slice(0, -1)
      : chainlitServer;
    super(apiKey, chainlitServer);
    this.chainlitServer = chainlitServer;
  }

  async createAppUser(appUser: IAppUser): Promise<IPersistedAppUser> {
    const mutation = `
            mutation ($username: String!, $role: Role!, $tags: [String!], $provider: String, $image: String) {
                createAppUser(username: $username, role: $role, tags: $tags, provider: $provider, image: $image) {
                    id,
                    username,
                    role,
                    tags,
                    provider,
                    image,
                    createdAt
                }
            }
        `;
    const res = await this.mutation(mutation, appUser);
    return res.createAppUser;
  }

  async updateAppUser(appUser: IAppUser): Promise<IPersistedAppUser> {
    const mutation = `
            mutation ($username: String!, $role: Role!, $tags: [String!], $provider: String, $image: String) {
                    updateAppUser(username: $username, role: $role, tags: $tags, provider: $provider, image: $image) {
                        id,
                        username,
                        role,
                        tags,
                        provider,
                        image,
                        createdAt
                    }
                }
            `;
    const res = await this.mutation(mutation, appUser);
    return res.updateAppUser;
  }

  async getAppUser(username: string): Promise<IPersistedAppUser> {
    const query = `
        query ($username: String!) {
            getAppUser(username: $username) {
                id,
                username,
                role,
                tags,
                provider,
                image,
                createdAt
            }
        }
    `;
    const variables = { username: username };
    const res = await this.query(query, variables);
    return res.getAppUser;
  }

  async deleteAppUser(username: string): Promise<boolean> {
    const mutation = `
        mutation ($username: String!) {
            deleteAppUser(username: $username) {
                id,
            }
        }
    `;
    const variables = { username: username };
    await this.mutation(mutation, variables);
    return true;
  }

  async createConversation(appUserId?: string): Promise<string> {
    const mutation = `
        mutation ($appUserId: String) {
            createConversation (appUserId: $appUserId) {
                id
            }
        }
    `;
    const variables = appUserId ? { appUserId: appUserId } : {};
    const res = await this.mutation(mutation, variables);
    return res.createConversation.id;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const mutation = `
        mutation ($id: ID!) {
            deleteConversation(id: $id) {
                id
            }
        }
    `;
    const variables = { id: conversationId };
    await this.mutation(mutation, variables);
    return true;
  }

  async getConversationAuthor(conversationId: string): Promise<string | null> {
    const query = `
        query ($id: ID!) {
            conversation(id: $id) {
                appUser {
                    username
                }
            }
        }
    `;
    const variables = { id: conversationId };
    const res = await this.query(query, variables);
    const appUser = res.conversation.appUser;
    if (appUser) {
      return appUser.username;
    } else {
      return null;
    }
  }

  async getConversation(conversationId: string): Promise<IConversation> {
    const query = `
        query ($id: ID!) {
            conversation(id: $id) {
                id
                createdAt
                messages {
                    id
                    isError
                    parentId
                    indent
                    author
                    content
                    waitForAnswer
                    humanFeedback
                    disableHumanFeedback
                    language
                    prompt
                    authorIsUser
                    createdAt
                }
                elements {
                    id
                    conversationId
                    type
                    name
                    url
                    display
                    language
                    size
                    forIds
                }
            }
        }
    `;
    const variables = { id: conversationId };
    const res = await this.query(query, variables);
    return res.conversation;
  }

  async getConversations(
    pagination: IPagination,
    filter?: IConversationFilter
  ): Promise<IPaginatedResponse<IConversation>> {
    const query = `
        query (
            $first: Int
            $cursor: String
            $withFeedback: Int
            $username: String
            $search: String
        ) {
            conversations(
                first: $first
                cursor: $cursor
                withFeedback: $withFeedback
                username: $username
                search: $search
            ) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                edges {
                    cursor
                    node {
                        id
                        createdAt
                        elementCount
                        messageCount
                        appUser {
                            username
                        }
                        messages {
                            content
                        }
                    }
                }
            }
        }
    `;
    const variables = {
      first: pagination.first,
      cursor: pagination.cursor,
      withFeedback: filter?.feedback,
      username: filter?.username,
      search: filter?.search
    };
    const res = await this.query(query, variables);
    const conversations = res.conversations.edges.map((edge: any) => edge.node);
    const pageInfo = res.conversations.pageInfo;
    return {
      pageInfo: {
        hasNextPage: pageInfo.hasNextPage,
        endCursor: pageInfo.endCursor
      },
      data: conversations
    };
  }

  async setHumanFeedback(
    messageId: string,
    feedback: number
  ): Promise<boolean> {
    const mutation = `
        mutation ($messageId: ID!, $humanFeedback: Int!) {
            setHumanFeedback(messageId: $messageId, humanFeedback: $humanFeedback) {
                id
                humanFeedback
            }
        }
    `;
    const variables = { messageId: messageId, humanFeedback: feedback };
    await this.mutation(mutation, variables);
    return true;
  }

  async getMessage(): Promise<void> {
    throw new Error('Not implemented');
  }

  async createMessage(variables: IMessage): Promise<string> {
    const mutation = `
        mutation ($id: ID!, $conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: Json, $isError: Boolean, $parentId: String, $indent: Int, $authorIsUser: Boolean, $disableHumanFeedback: Boolean, $waitForAnswer: Boolean, $createdAt: StringOrFloat) {
            createMessage(id: $id, conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, isError: $isError, parentId: $parentId, indent: $indent, authorIsUser: $authorIsUser, disableHumanFeedback: $disableHumanFeedback, waitForAnswer: $waitForAnswer, createdAt: $createdAt) {
                id
            }
        }
    `;
    const res = await this.mutation(mutation, variables);
    return res.createMessage.id;
  }

  async updateMessage(
    messageId: string,
    variables: IMessage
  ): Promise<boolean> {
    const mutation = `
        mutation ($messageId: ID!, $author: String!, $content: String!, $parentId: String, $language: String, $prompt: Json, $disableHumanFeedback: Boolean) {
            updateMessage(messageId: $messageId, author: $author, content: $content, parentId: $parentId, language: $language,  prompt: $prompt, disableHumanFeedback: $disableHumanFeedback) {
                id
            }
        }
    `;
    await this.mutation(mutation, {
      messageId: messageId,
      ...variables
    });
    return true;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const mutation = `
        mutation ($messageId: ID!) {
            deleteMessage(messageId: $messageId) {
                id
            }
        }
    `;
    await this.mutation(mutation, { messageId: messageId });
    return true;
  }

  async getElement(
    conversationId: string,
    elementId: string
  ): Promise<IElement> {
    const query = `
        query ($conversationId: ID!, $id: ID!) {
            element(conversationId: $conversationId, id: $id) {
                id
                conversationId
                type
                name
                url
                display
                language
                size
                forIds
            }
        }
    `;
    const variables = { conversationId: conversationId, id: elementId };
    const res = await this.query(query, variables);
    return res.element;
  }

  async createElement(variables: IElement): Promise<IElement> {
    const mutation = `
        mutation ($conversationId: ID!, $type: String!, $name: String!, $display: String!, $forIds: [String!]!, $url: String, $objectKey: String, $size: String, $language: String) {
            createElement(conversationId: $conversationId, type: $type, url: $url, objectKey: $objectKey, name: $name, display: $display, size: $size, language: $language, forIds: $forIds) {
                id,
                type,
                url,
                objectKey,
                name,
                display,
                size,
                language,
                forIds
            }
        }
    `;
    const res = await this.mutation(mutation, variables);
    return res.createElement;
  }

  async updateElement(variables: IElement): Promise<IElement> {
    const mutation = `
        mutation ($conversationId: ID!, $id: ID!, $forIds: [String!]!) {
            updateElement(conversationId: $conversationId, id: $id, forIds: $forIds) {
                id,
            }
        }
    `;
    const res = await this.mutation(mutation, variables);
    return res.updateElement;
  }

  async uploadElement(content: Blob, mime: string) {
    const id = uuidv4();
    const body = { fileName: id, contentType: mime };
    const path = '/api/upload/file';
    const response = await fetch(`${this.chainlitServer}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Failed to sign upload url: ${reason}`);
    }
    const jsonRes = await response.json();
    const uploadDetails = jsonRes.post;
    const objectKey: string = uploadDetails.fields.key;
    const signedUrl: string = jsonRes.signedUrl;
    const formData = new FormData();
    for (const [fieldName, fieldValue] of Object.entries(
      uploadDetails.fields
    )) {
      formData.append(fieldName, fieldValue as string);
    }
    formData.append('file', content, 'multipart/form-data');
    const uploadResponse = await fetch(uploadDetails.url, {
      method: 'POST',
      body: formData
    });
    if (!uploadResponse.ok) {
      const reason = await uploadResponse.text();
      throw new Error(`Failed to upload file: ${reason}`);
    }
    // const url = `${uploadDetails.url}/${objectKey}`;
    return { object_key: objectKey, url: signedUrl };
  }
}
