import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Trim whitespace and trailing slashes so auth requests hit a valid origin. */
export function normalizeSupabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim().replace(/\/+$/, "")
  if (process.env.NODE_ENV === "development" && trimmed && !/^https:\/\//i.test(trimmed)) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL should use https:// for hosted Supabase projects.")
  }
  return trimmed
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

type GlobalWithSupabase = typeof globalThis & { __classSchedulingSupabase__?: SupabaseClient }

function hostnameFromSupabaseUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

function createConfiguredClient(): SupabaseClient {
  const url = supabaseUrl || "http://127.0.0.1:54321"
  const key = supabaseAnonKey || "missing-anon-key"
  const browser = typeof window !== "undefined"
  const useBrowserAuth = browser && hasSupabaseEnv

  return createClient(url, key, {
    auth: {
      persistSession: useBrowserAuth,
      autoRefreshToken: useBrowserAuth,
      detectSessionInUrl: useBrowserAuth,
      ...(useBrowserAuth ? { storage: window.localStorage } : {}),
    },
  })
}

const g = globalThis as GlobalWithSupabase

/**
 * One client per browser tab. Reuses the same instance across Fast Refresh so
 * GoTrue does not spawn multiple auto-refresh timers (a common source of noisy
 * "Failed to fetch" errors during dev).
 */
export const supabase: SupabaseClient =
  typeof window !== "undefined"
    ? (g.__classSchedulingSupabase__ ??= createConfiguredClient())
    : createConfiguredClient()

export const assertSupabaseEnv = () => {
  if (!hasSupabaseEnv) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
}

/**
 * Stops the auth refresh loop and removes Supabase session keys from
 * localStorage. Use when refresh/network fails so the app does not retry with a
 * broken or stale session. Does not call the remote logout API.
 */
export async function clearSupabaseBrowserAuth(): Promise<void> {
  if (typeof window === "undefined") return
  try {
    await supabase.auth.stopAutoRefresh()
  } catch {
    /* ignore */
  }
  if (!supabaseUrl) return
  const host = hostnameFromSupabaseUrl(supabaseUrl)
  const projectRef = host.includes(".") ? host.split(".")[0] : ""
  if (!projectRef) return
  const prefix = `sb-${projectRef}-`
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith(prefix)) {
      window.localStorage.removeItem(key)
    }
  }
}
