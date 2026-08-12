import { supabase, supabaseConfigured } from './supabase';
import type { Group } from '../types';

const TABLE = 'groups';

export class BackendNotConfiguredError extends Error {
  constructor() {
    super('Supabase backend is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
    this.name = 'BackendNotConfiguredError';
  }
}

function requireClient() {
  if (!supabaseConfigured || !supabase) throw new BackendNotConfiguredError();
  return supabase;
}

function rowToGroup(row: Record<string, unknown>): Group {
  return {
    code: row.code as string,
    name: row.name as string,
    createdAt: row.created_at as number,
    founderId: (row.founder_id as string | null) ?? undefined,
    objectives: (row.objectives as Group['objectives']) ?? [],
    members: (row.members as Group['members']) ?? [],
    messages: (row.messages as Group['messages']) ?? [],
  };
}

function groupToRow(group: Group) {
  return {
    code: group.code,
    name: group.name,
    created_at: group.createdAt,
    founder_id: group.founderId ?? null,
    objectives: group.objectives,
    members: group.members,
    messages: group.messages,
  };
}

export async function fetchGroup(code: string): Promise<Group | null> {
  const client = requireClient();
  const { data, error } = await client.from(TABLE).select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  return data ? rowToGroup(data) : null;
}

/** Every cell, for the global/inter-cell rankings. RLS keeps this open to all
 * rows (see supabase/schema.sql) since there is no per-user auth in this app. */
export async function fetchAllGroups(): Promise<Group[]> {
  const client = requireClient();
  const { data, error } = await client.from(TABLE).select('*');
  if (error) throw error;
  return (data ?? []).map(rowToGroup);
}

export async function insertGroup(group: Group): Promise<void> {
  const client = requireClient();
  const { error } = await client.from(TABLE).insert(groupToRow(group));
  if (error) throw error;
}

export async function saveGroup(group: Group): Promise<void> {
  const client = requireClient();
  const { error } = await client.from(TABLE).update(groupToRow(group)).eq('code', group.code);
  if (error) throw error;
}

/** Pseudos are unique across the whole app (they double as a login username),
 * not just within one cell — so uniqueness has to be checked against every
 * cell's member list. */
export async function findMemberByPseudo(pseudo: string): Promise<{ group: Group; member: Group['members'][number] } | null> {
  const normalized = pseudo.trim().toLowerCase();
  const groups = await fetchAllGroups();
  for (const group of groups) {
    const member = group.members.find((m) => m.name.trim().toLowerCase() === normalized);
    if (member) return { group, member };
  }
  return null;
}

export function subscribeGroup(code: string, onChange: (group: Group) => void): () => void {
  if (!supabaseConfigured || !supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel(`group:${code}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: TABLE, filter: `code=eq.${code}` },
      (payload) => onChange(rowToGroup(payload.new as Record<string, unknown>))
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
