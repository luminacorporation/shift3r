import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in waitlist/.env'
  );
}

export const supabase = createClient(url, anonKey);

/**
 * Add an email to the waitlist via the join_waitlist RPC (insert + position
 * computed server-side in one transaction, so emails are never readable by
 * anonymous clients). Returns the 1-based waitlist position.
 */
export async function joinWaitlist(email: string): Promise<number> {
  const { data, error } = await supabase.rpc('join_waitlist', {
    p_email: email,
  });

  if (error) throw error;

  const result = data as { id: number; position: number } | null;
  if (!result || typeof result.position !== 'number') {
    throw new Error('Unexpected response from the server.');
  }
  return result.position;
}

/** Total number of waitlist signups (null if the RPC isn't set up yet). */
export async function getWaitlistCount(): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('waitlist_count');
    if (error) return null;
    return typeof data === 'number' ? data : null;
  } catch {
    return null;
  }
}
