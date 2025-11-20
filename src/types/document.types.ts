export interface UploadRequest {
  file: Express.Multer.File;
  taskId: string;
  documentType?: 'PDF' | 'IMAGE';
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  mimeType: string;
  filename: string;
  uploadedAt: Date;
  gatewayUrl: string;
}

export interface UploadResponse {
  success: boolean;
  data: {
    cid: string;
    filename: string;
    size: number;
    mimeType: string;
    gatewayUrl: string;
    uploadedAt: string;
    arkivEntityId?: string;
  };
}

