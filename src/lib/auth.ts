import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(cb: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null));
}
