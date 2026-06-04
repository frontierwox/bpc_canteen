import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billAPI } from '../api/bill.api';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: (data) => billAPI.create(data),
    onSuccess: () => {
      toast.success('Bill created successfully!');
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create bill');
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => billAPI.recordPayment(id, data),
    onSuccess: () => {
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    },
  });
};

export default useCreateBill;
