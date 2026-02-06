import { supabase } from '../config/supabase';

const LS_PREFIX = 'scgmex_';

function getLocal(table) {
  try {
    const data = localStorage.getItem(LS_PREFIX + table);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setLocal(table, data) {
  localStorage.setItem(LS_PREFIX + table, JSON.stringify(data));
}

export async function fetchAll(table, { select = '*', filter = {}, order = { column: 'created_at', ascending: true } } = {}) {
  if (supabase) {
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
  // localStorage fallback
  let data = getLocal(table);
  for (const [key, value] of Object.entries(filter)) {
    data = data.filter(item => item[key] === value);
  }
  if (order) {
    data.sort((a, b) => {
      const aVal = a[order.column] || '';
      const bVal = b[order.column] || '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return order.ascending ? cmp : -cmp;
    });
  }
  return data;
}

export async function fetchOne(table, id) {
  if (supabase) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
  const all = getLocal(table);
  return all.find(item => item.id === id) || null;
}

export async function create(table, record) {
  if (supabase) {
    const { data, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw error;
    return data;
  }
  // localStorage fallback
  const all = getLocal(table);
  const newRecord = {
    ...record,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  all.push(newRecord);
  setLocal(table, all);
  return newRecord;
}

export async function update(table, id, changes) {
  if (supabase) {
    const { data, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const all = getLocal(table);
  const idx = all.findIndex(item => item.id === id);
  if (idx === -1) throw new Error('Not found');
  all[idx] = { ...all[idx], ...changes, updated_at: new Date().toISOString() };
  setLocal(table, all);
  return all[idx];
}

export async function remove(table, id) {
  if (supabase) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  const all = getLocal(table);
  setLocal(table, all.filter(item => item.id !== id));
  return true;
}
