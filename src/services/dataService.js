import { supabase } from '../config/supabase';

export async function fetchAll(table, { select = '*', filter = {}, order = { column: 'created_at', ascending: true } } = {}) {
  let query = supabase.from(table).select(select);
  for (const [key, value] of Object.entries(filter)) {
    query = query.eq(key, value);
  }
  if (order) {
    query = query.order(order.column, { ascending: order.ascending });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchOne(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function create(table, record) {
  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function update(table, id, changes) {
  const { data, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}
