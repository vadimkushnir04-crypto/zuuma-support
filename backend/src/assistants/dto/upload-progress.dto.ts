export interface UploadProgress {
  stage: 'uploading' | 'parsing' | 'embedding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  fileId?: string;
}