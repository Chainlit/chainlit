export interface OutputAudioChunk {
  track: string;
  mimeType: string;
  data: Int16Array;
}
