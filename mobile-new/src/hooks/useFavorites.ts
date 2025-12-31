import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { favoritesApi } from '../api';
import { attractionKeys } from './useAttractions';

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
  check: (attractionId: string) =>
    [...favoriteKeys.all, 'check', attractionId] as const,
  count: () => [...favoriteKeys.all, 'count'] as const,
};

export function useFavorites() {
  return useInfiniteQuery({
    queryKey: favoriteKeys.list(),
    queryFn: ({ pageParam = 1 }) => favoritesApi.getAll({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function useIsFavorite(attractionId: string) {
  return useQuery({
    queryKey: favoriteKeys.check(attractionId),
    queryFn: () => favoritesApi.check(attractionId),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useFavoritesCount() {
  return useQuery({
    queryKey: favoriteKeys.count(),
    queryFn: () => favoritesApi.getCount(),
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attractionId: string) => favoritesApi.add(attractionId),
    onSuccess: (_, attractionId) => {
      // Optimistically update the check query
      queryClient.setQueryData(favoriteKeys.check(attractionId), true);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.count() });
      queryClient.invalidateQueries({
        queryKey: attractionKeys.detail(attractionId),
      });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attractionId: string) => favoritesApi.remove(attractionId),
    onSuccess: (_, attractionId) => {
      // Optimistically update the check query
      queryClient.setQueryData(favoriteKeys.check(attractionId), false);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.count() });
      queryClient.invalidateQueries({
        queryKey: attractionKeys.detail(attractionId),
      });
    },
  });
}

export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  return {
    mutate: (attractionId: string, isFavorited: boolean) => {
      if (isFavorited) {
        removeFavorite.mutate(attractionId);
      } else {
        addFavorite.mutate(attractionId);
      }
    },
    isPending: addFavorite.isPending || removeFavorite.isPending,
  };
}
