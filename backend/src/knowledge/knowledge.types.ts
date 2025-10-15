// backend/src/knowledge/knowledge.types.ts

export interface DocumentMetadata {
  title: string;
  description?: string;
  fileType: 'text' | 'pdf' | 'image' | 'doc' | 'markdown';
  filePath?: string;
  fileUrl?: string;
  mimeType?: string;
  fileSize?: number;
  pageCount?: number;
  
  // ✅ ДОБАВИТЬ эти поля:
  chunkIndex?: number;
  totalChunks?: number;
  collectionName?: string;
  assistantId?: string;
  source?: string;
  timestamp?: string;
  language?: string;
  tags?: string[];
}

export interface GenerateAnswerResult {
  answer: string;
  hasContext: boolean;
  sources: number;
  
  functionCalled?: string;
  functionArgs?: any;
  functionResult?: any;
  
  searchResults?: Array<{
    text: string;
    score: number;
    title: string;
    chunkIndex?: number;
  }>;
  
  files?: Array<{
    fileUrl: string;
    fileName: string;
    fileType: 'text' | 'pdf' | 'image' | 'doc' | 'markdown';
    pageNumber?: number;
  }>;
  
  isToxic?: boolean;
  toxicCount?: number;
  fromCache?: boolean;
  fromCannedResponses?: boolean;
  tokensCharged?: number;
  cannedTokensCharged?: number;
  error?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload: {
    text: string;
    collectionName?: string;
    title?: string;
    chunkIndex?: number;
    source?: string;
    timestamp?: string;
    fileUrl?: string;
    fileType?: 'text' | 'pdf' | 'image' | 'doc' | 'markdown';
    pageNumber?: number;
    mimeType?: string;
    fileSize?: number;
  };
}

export interface DocumentSearchResult {
  id: string | number;
  payload: SearchResult['payload'];
}

export interface KnowledgeUploadResult {
  success: boolean;
  chunks: number;
  message: string;
}

export interface FileUploadResult {
  success: boolean;
  message: string;
  chunks: number;
  fileInfo?: {
    originalName: string;
    savedPath: string;
    fileType: 'text' | 'pdf' | 'image' | 'doc' | 'markdown';
    fileSize: number;
    pageCount?: number;
  };
}

export interface KnowledgeStats {
  documentsCount: number;
  companyId: string;
  vectorSize: number;
  distance: string;
  error?: string;
}