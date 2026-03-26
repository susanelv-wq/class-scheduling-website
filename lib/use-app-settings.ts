"use client"

import { useEffect, useState } from "react"
import { settingsApi, type AppSettings } from "@/lib/api"

let cached: AppSettings | null = null
let inflight: Promise<AppSettings> | null = null

async function loadSettings(): Promise<AppSettings> {
  if (cached) return cached
  if (!inflight) {
    inflight = settingsApi
      .get()
      .then((s) => {
        cached = s
        return s
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (cached) return
    setLoading(true)
    loadSettings()
      .then((s) => {
        if (!alive) return
        setSettings(s)
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load settings")
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const refresh = async () => {
    cached = null
    inflight = null
    setLoading(true)
    setError(null)
    try {
      const s = await loadSettings()
      setSettings(s)
      return s
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings")
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, error, refresh }
}

