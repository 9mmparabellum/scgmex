import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAll, fetchOne, create, update, remove } from '../services/dataService';
import { useToastStore } from '../stores/toastStore';

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      useToastStore.getState().addToast({ type: 'success', title: 'Registro creado', message: 'El registro se creo correctamente' });
    },
    onError: (err) => {
      useToastStore.getState().addToast({ type: 'error', title: 'Error al crear', message: err.message || 'Ocurrio un error' });
    },
  });
}

export function useUpdate(table) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }) => update(table, id, changes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      useToastStore.getState().addToast({ type: 'success', title: 'Registro actualizado', message: 'El registro se actualizo correctamente' });
    },
    onError: (err) => {
      useToastStore.getState().addToast({ type: 'error', title: 'Error al actualizar', message: err.message || 'Ocurrio un error' });
    },
  });
}

export function useRemove(table) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => remove(table, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      useToastStore.getState().addToast({ type: 'success', title: 'Registro eliminado', message: 'El registro se elimino correctamente' });
    },
    onError: (err) => {
      useToastStore.getState().addToast({ type: 'error', title: 'Error al eliminar', message: err.message || 'Ocurrio un error' });
    },
  });
}
