import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewsApi } from '../api';
import { CreateReviewRequest, UpdateReviewRequest } from '../types';
import { attractionKeys } from './useAttractions';

export const reviewKeys = {
  all: ['reviews'] as const,
  forAttraction: (attractionId: string) =>
    [...reviewKeys.all, 'attraction', attractionId] as const,
  detail: (id: string) => [...reviewKeys.all, 'detail', id] as const,
  stats: (attractionId: string) =>
    [...reviewKeys.all, 'stats', attractionId] as const,
  userReviews: () => [...reviewKeys.all, 'user'] as const,
};

export function useReviewsForAttraction(attractionId: string) {
  return useInfiniteQuery({
    queryKey: reviewKeys.forAttraction(attractionId),
    queryFn: ({ pageParam = 1 }) =>
      reviewsApi.getForAttraction({ attractionId, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: () => reviewsApi.getById(id),
    staleTime: 3 * 60 * 1000,
  });
}

export function useReviewStats(attractionId: string) {
  return useQuery({
    queryKey: reviewKeys.stats(attractionId),
    queryFn: () => reviewsApi.getStats(attractionId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserReviews() {
  return useInfiniteQuery({
    queryKey: reviewKeys.userReviews(),
    queryFn: ({ pageParam = 1 }) => reviewsApi.getUserReviews(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewsApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: reviewKeys.forAttraction(variables.attractionId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(variables.attractionId),
      });
      queryClient.invalidateQueries({
        queryKey: attractionKeys.detail(variables.attractionId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviews(),
      });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReviewRequest;
      attractionId: string;
    }) => reviewsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.forAttraction(variables.attractionId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(variables.attractionId),
      });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; attractionId: string }) =>
      reviewsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.forAttraction(variables.attractionId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(variables.attractionId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviews(),
      });
    },
  });
}

export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewsApi.markHelpful(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(id),
      });
    },
  });
}
