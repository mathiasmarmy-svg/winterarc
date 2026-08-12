import { supabase, supabaseConfigured } from './supabase';
import type { Group } from '../types';

const TABLE = 'groups';

export class BackendNotConfiguredError extends Error {
  constructor() {
    super(
      "Le backend Supabase n'est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants)."
    );
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
