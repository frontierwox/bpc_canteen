import { useQuery } from '@tanstack/react-query';
import { menuAPI, categoryAPI } from '../api/menu.api';

export const useMenu = (params = {}) => {
  return useQuery({
    queryKey: ['menu', params],
    queryFn: () => menuAPI.getAll(params).then((r) => r.data.data),
  });
};

export const usePublicMenu = () => {
  return useQuery({
    queryKey: ['publicMenu'],
    queryFn: () => menuAPI.getPublicMenu().then((r) => r.data.data),
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
};

export default useMenu;
