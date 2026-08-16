import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set these in your Vercel project env vars.'
  );
}

// Fall back to placeholder values so createClient doesn't throw; callers
// must check isSupabaseConfigured before relying on real data.
export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder');

/**
 * Add an email to the waitlist via the join_waitlist RPC (insert + position
 * computed server-side in one transaction, so emails are never readable by
 * anonymous clients). Returns the 1-based waitlist position.
 */
export async function joinWaitlist(email: string): Promise<number> {
  if (!isSupabaseConfigured) {
    throw new Error('Waitlist is temporarily unavailable. Please try again shortly.');
  }
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
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc('waitlist_count');
    if (error) return null;
    return typeof data === 'number' ? data : null;
  } catch {
    return null;
  }
}
