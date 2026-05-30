import { createBrowserClient } from "@supabase/ssr";

function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env.url || !env.publishableKey) {
    throw new Error(
      "Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createBrowserClient(env.url, env.publishableKey);
}
