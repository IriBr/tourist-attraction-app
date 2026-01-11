import { apiClient } from './config';

export interface AttractionSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  thumbnailUrl: string;
}

export interface VerifyRequest {
  image: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface VerifyResponse {
  matched: boolean;
  confidence: number;
  explanation?: string;
  message?: string;
  // When matched with high confidence
  attraction?: AttractionSummary;
  visit?: {
    id: string;
    visitDate: string;
  };
  alreadyVisited?: boolean;
  // When requires confirmation
  requiresConfirmation?: boolean;
  suggestion?: AttractionSummary;
}

export interface ConfirmResponse {
  matched: boolean;
  attraction: AttractionSummary;
  visit?: {
    id: string;
    visitDate: string;
  };
  alreadyVisited?: boolean;
  message?: string;
}

export interface VerificationStatus {
  tier: string;
  isPremium: boolean;
  canUseCameraScanning: boolean;
  message: string;
}

export const verificationApi = {
  /**
   * Verify an attraction from an image
   * - Camera mode: provide latitude/longitude for location-based search
   * - Upload mode: omit location for global search
   */
  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const response = await apiClient.post('/verification/verify', request);
    return response.data.data;
  },

  /**
   * Confirm a suggested match and create visit
   */
  async confirmSuggestion(attractionId: string): Promise<ConfirmResponse> {
    const response = await apiClient.post('/verification/confirm', { attractionId });
    return response.data.data;
  },

  /**
   * Get verification status (scans remaining, etc.)
   */
  async getStatus(): Promise<VerificationStatus> {
    const response = await apiClient.get('/verification/status');
    return response.data.data;
  },
};
