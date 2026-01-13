export enum SuggestionType {
  SUGGEST_REMOVE = 'suggest_remove',
  SUGGEST_VERIFY = 'suggest_verify',
  COMMENT = 'comment',
}

export enum SuggestionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESOLVED = 'resolved',
}

export interface Suggestion {
  id: string;
  attractionId: string;
  userId: string;
  type: SuggestionType;
  status: SuggestionStatus;
  comment: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionWithDetails extends Suggestion {
  user: {
    id: string;
    name: string;
    email: string;
  };
  attraction: {
    id: string;
    name: string;
    city: string;
    country: string;
    isVerified: boolean;
  };
}

export interface CreateSuggestionRequest {
  attractionId: string;
  type: SuggestionType;
  comment?: string;
}

export interface UpdateSuggestionRequest {
  status: SuggestionStatus;
  adminNotes?: string;
}

export interface SuggestionSearchParams {
  status?: SuggestionStatus;
  type?: SuggestionType;
  attractionId?: string;
  page?: number;
  limit?: number;
}
