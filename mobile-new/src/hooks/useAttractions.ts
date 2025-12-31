import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { attractionsApi } from '../api';
import { AttractionSearchParams, AttractionCategory } from '@tourist-app/shared';

export const attractionKeys = {
  all: ['attractions'] as const,
  search: (params: AttractionSearchParams) =>
    [...attractionKeys.all, 'search', params] as const,
  detail: (id: string) => [...attractionKeys.all, 'detail', id] as const,
  nearby: (lat: number, lng: number, radius?: number, category?: AttractionCategory) =>
    [...attractionKeys.all, 'nearby', lat, lng, radius, category] as const,
  popular: (limit?: number) => [...attractionKeys.all, 'popular', limit] as const,
  category: (category: AttractionCategory) =>
    [...attractionKeys.all, 'category', category] as const,
};

export function useAttraction(id: string) {
  return useQuery({
    queryKey: attractionKeys.detail(id),
    queryFn: () => attractionsApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAttractionSearch(params: AttractionSearchParams) {
  return useInfiniteQuery({
    queryKey: attractionKeys.search(params),
    queryFn: ({ pageParam = 1 }) =>
      attractionsApi.search({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNearbyAttractions(
  latitude: number | null,
  longitude: number | null,
  radiusMeters?: number,
  category?: AttractionCategory,
  limit?: number
) {
  return useQuery({
    queryKey: attractionKeys.nearby(
      latitude ?? 0,
      longitude ?? 0,
      radiusMeters,
      category
    ),
    queryFn: () =>
      attractionsApi.getNearby(latitude!, longitude!, radiusMeters, category, limit),
    enabled: latitude !== null && longitude !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularAttractions(limit?: number) {
  return useQuery({
    queryKey: attractionKeys.popular(limit),
    queryFn: () => attractionsApi.getPopular(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttractionsByCategory(category: AttractionCategory) {
  return useInfiniteQuery({
    queryKey: attractionKeys.category(category),
    queryFn: ({ pageParam = 1 }) =>
      attractionsApi.getByCategory(category, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
