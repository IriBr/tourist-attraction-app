export interface Review {
  id: string;
  attractionId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  rating: number; // 1-5
  title: string;
  content: string;
  images: string[];
  visitDate?: string;
  helpfulCount: number;
  isHelpful?: boolean; // Whether current user marked it helpful
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  id: string;
  userName: string;
  userAvatarUrl: string | null;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  attractionId: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  visitDate?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  images?: string[];
  visitDate?: string;
}

export interface ReviewSearchParams {
  attractionId: string;
  sortBy?: 'recent' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
