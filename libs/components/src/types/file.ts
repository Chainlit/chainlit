export interface FileSpec {
  accept?: string[] | Record<string, string[]>;
  max_size_mb?: number;
  max_files?: number;
}

export interface IFileResponse {
  name: string;
  path?: string;
  size: number;
  type: string;
  content: ArrayBuffer;
}

export interface IAskResponse {
  content: string;
  author: string;
}

export interface IAsk {
  callback: (payload: IAskResponse | IFileResponse[]) => void;
  spec: {
    type: 'text' | 'file';
    timeout: number;
  } & FileSpec;
}
