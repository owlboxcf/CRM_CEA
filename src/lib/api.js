import { supabase } from './supabase';

// ---------- Auth ----------

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

export async function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email);
}

// ---------- Perfil ----------

export async function getMeuPerfil(userId) {
  const { data, error } = await supabase.from('perfis').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function getVendedores() {
  const { data, error } = await supabase.from('perfis').select('*').eq('perfil', 'Vendedor').order('nome');
  if (error) throw error;
  return data;
}

// ---------- Planos ----------

export async function getPlanos() {
  const { data, error } = await supabase.from('planos').select('*').order('id');
  if (error) throw error;
  return data;
}

// ---------- Leads ----------

export async function getLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('data_entrada', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLead(lead) {
  const { data, error } = await supabase.from('leads').insert(lead).select().single();
  if (error) throw error;
  return data;
}

export async function updateLeadStatus(id, status) {
  const { data, error } = await supabase.from('leads').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLead(id) {
  // ON DELETE CASCADE no banco já remove as atividades vinculadas.
  // As vendas vinculadas ficam (id_lead vira null), conforme a regra de negócio.
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Atividades ----------

export async function getAtividades() {
  const { data, error } = await supabase.from('atividades').select('*').order('data', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAtividade(atividade) {
  const { data, error } = await supabase.from('atividades').insert(atividade).select().single();
  if (error) throw error;
  return data;
}

// ---------- Vendas ----------

export async function getVendas() {
  const { data, error } = await supabase.from('vendas').select('*').order('data', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createVenda(venda) {
  const { data, error } = await supabase.from('vendas').insert(venda).select().single();
  if (error) throw error;
  return data;
}

// ---------- Ranking (função no banco, não expõe comissão pra quem não é gestor) ----------

export async function getRanking() {
  const { data, error } = await supabase.rpc('ranking_vendedores');
  if (error) throw error;
  return data;
}

// ---------- Opções configuráveis ----------

export async function getTodasOpcoes() {
  const { data, error } = await supabase
    .from('opcoes_configuraveis')
    .select('*')
    .order('tipo')
    .order('ordem')
    .order('valor');
  if (error) throw error;
  return data;
}

export async function createOpcao(tipo, valor) {
  const { data, error } = await supabase.from('opcoes_configuraveis').insert({ tipo, valor }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOpcao(id) {
  const { error } = await supabase.from('opcoes_configuraveis').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Ponto ----------

export async function getPontoRegistros() {
  const { data, error } = await supabase.from('ponto_registros').select('*').order('data_hora', { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarPonto(idVendedor, tipo) {
  const { data, error } = await supabase
    .from('ponto_registros')
    .insert({ id_vendedor: idVendedor, tipo })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addPontoManual({ id_vendedor, tipo, data_hora }) {
  const { data, error } = await supabase
    .from('ponto_registros')
    .insert({ id_vendedor, tipo, data_hora })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePontoRegistro(id, data_hora) {
  const { data, error } = await supabase
    .from('ponto_registros')
    .update({ data_hora })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePontoRegistro(id) {
  const { error } = await supabase.from('ponto_registros').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Feriados ----------

export async function getFeriados() {
  const { data, error } = await supabase.from('feriados').select('*').order('data');
  if (error) throw error;
  return data;
}

export async function createFeriado({ data, descricao }) {
  const { data: row, error } = await supabase.from('feriados').insert({ data, descricao }).select().single();
  if (error) throw error;
  return row;
}

export async function deleteFeriado(id) {
  const { error } = await supabase.from('feriados').delete().eq('id', id);
  if (error) throw error;
}
