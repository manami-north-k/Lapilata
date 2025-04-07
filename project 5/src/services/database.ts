import { supabase } from '../lib/supabase';
import { Expense, FixedExpense, DailySales } from '../types';

export async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, expense: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getDailySales() {
  const { data, error } = await supabase
    .from('daily_sales')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createDailySales(sale: Omit<DailySales, 'id'>) {
  const { data, error } = await supabase
    .from('daily_sales')
    .insert([sale])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDailySales(id: string, sale: Partial<DailySales>) {
  const { data, error } = await supabase
    .from('daily_sales')
    .update(sale)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDailySales(id: string) {
  const { error } = await supabase
    .from('daily_sales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getFixedExpenses() {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .order('due_day', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createFixedExpense(expense: Omit<FixedExpense, 'id'>) {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert([expense])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFixedExpense(id: string, expense: Partial<FixedExpense>) {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFixedExpense(id: string) {
  const { error } = await supabase
    .from('fixed_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}