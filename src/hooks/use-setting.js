import { useState, useEffect } from "react"

const cache = {}

export function useSetting(key, defaultValue = null) {
  const [value, setValue] = useState(() => cache[key] ?? defaultValue)

  useEffect(() => {
    let cancelled = false

    if (cache[key] !== undefined) {
      setValue(cache[key])
      return
    }

    window.db.getSetting(key).then((v) => {
      if (cancelled) return
      const resolved = v ?? defaultValue
      cache[key] = resolved
      setValue(resolved)
    }).catch(() => {})

    const handler = (e) => {
      if (e.detail?.key === key) {
        cache[key] = e.detail.value
        setValue(e.detail.value)
      }
    }
    window.addEventListener("setting-changed", handler)
    return () => {
      cancelled = true
      window.removeEventListener("setting-changed", handler)
    }
  }, [key, defaultValue])

  return value
}

export function setSetting(key, value) {
  cache[key] = value
  window.db.setSetting(key, value).catch(() => {})
  window.dispatchEvent(new CustomEvent("setting-changed", { detail: { key, value } }))
}

export function getSettingCache(key, defaultValue = null) {
  return cache[key] ?? defaultValue
}
