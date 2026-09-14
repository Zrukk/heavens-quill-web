import { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext()

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 'medium',
  fontFamily: 'default',
  contentWidth: 'normal',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('hq-settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    localStorage.setItem('hq-settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    document.documentElement.setAttribute('data-font-size', settings.fontSize)
    document.documentElement.setAttribute('data-font-family', settings.fontFamily)
    document.documentElement.setAttribute('data-content-width', settings.contentWidth)
  }, [settings.theme, settings.fontSize, settings.fontFamily, settings.contentWidth])

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
    }
