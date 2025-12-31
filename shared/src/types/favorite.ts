import { AttractionSummary } from './attraction';

export interface Favorite {
  id: string;
  userId: string;
  attractionId: string;
  createdAt: string;
}

export interface FavoriteWithAttraction extends Favorite {
  attraction: AttractionSummary;
}

export interface AddFavoriteRequest {
  attractionId: string;
}

export interface FavoritesListParams {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'name';
  sortOrder?: 'asc' | 'desc';
}
