export interface IMcp {
    name: string;
    tools: [{name: string}]
    clientType: "sse" | "stdio"
    command?: string
    url?: string
}