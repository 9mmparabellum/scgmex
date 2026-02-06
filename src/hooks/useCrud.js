import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAll, fetchOne, create, update, remove } from '../services/dataService';

export function useList(table, options = {}) {
  return useQuery({
    queryKey: [table, options],
    queryFn: () => fetchAll(table, options),
  });
}

export function useOne(table, id) {
  return useQuery({
    queryKey: [table, id],
    queryFn: () => fetchOne(table, id),
    enabled: !!id,
  });
}

export function useCreate(table) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record) => create(table, record),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useUpdate(table) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }) => update(table, id, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useRemove(table) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => remove(table, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}
