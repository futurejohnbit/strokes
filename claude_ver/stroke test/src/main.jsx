import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import GeminiApp from './GeminiApp.jsx'
import { initBleSupport } from './utils/bleSupport'
import {
  createThemeAudioEngine,
  getAudioStorageKeys,
  persistAudioPreference,
  readStoredAudioPreference,
} from './utils/themeAudio'
import './index.css'

const AUDIO_STORAGE_KEYS = getAudioStorageKeys()
const ENABLE_DEBUG_ROUTES = import.meta.env.DEV
const StrokeTest = ENABLE_DEBUG_ROUTES ? React.lazy(() => import('./StrokeTest.jsx')) : null

function normalizeRoute(pathname) {
  if (!pathname || pathname === '/') return '/'
  if (pathname.startsWith('/intro') || pathname.startsWith('/home-v2') || pathname.startsWith('/preview/home-v2')) return '/'
  if (ENABLE_DEBUG_ROUTES && pathname.startsWith('/debug')) return '/debug'
  return '/'
}

function Root() {
  const params = useMemo(() => new URLSearchParams(window.location.search || ''), [])
  const [route, setRoute] = useState(() => {
    const current = normalizeRoute(window.location.pathname || '/')
    return ENABLE_DEBUG_ROUTES && params.get('debug') === '1' ? '/debug' : current
  })
  const [musicEnabled, setMusicEnabled] = useState(() =>
    readStoredAudioPreference(AUDIO_STORAGE_KEYS.music, false)
  )
  const audioEngineRef = useRef(null)

  useEffect(() => {
    audioEngineRef.current = createThemeAudioEngine()
    audioEngineRef.current?.setMusicScene('menu')
    return () => {
      audioEngineRef.current?.destroy()
      audioEngineRef.current = null
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setRoute(normalizeRoute(window.location.pathname || '/'))
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    persistAudioPreference(AUDIO_STORAGE_KEYS.music, musicEnabled)
    if (musicEnabled) {
      audioEngineRef.current?.startMusic()
    } else {
      audioEngineRef.current?.stopMusic()
    }
  }, [musicEnabled])

  const playUiSfx = useCallback((kind = 'step') => {
    audioEngineRef.current?.playUiSfx(kind)
  }, [])

  const primeAudio = useCallback(() => {
    audioEngineRef.current?.primeAudio?.()
  }, [])

  const handleAudioSceneChange = useCallback((scene = 'menu') => {
    audioEngineRef.current?.setMusicScene(scene)
  }, [])

  const onToggleMusic = useCallback(() => {
    if (!musicEnabled) {
      audioEngineRef.current?.playUiSfx('reward')
      audioEngineRef.current?.setMusicScene('menu')
      audioEngineRef.current?.startMusic()
    }
    setMusicEnabled((prev) => !prev)
  }, [musicEnabled])

  return (
    <>
      {ENABLE_DEBUG_ROUTES && route === '/debug' && StrokeTest ? (
        <Suspense fallback={null}>
          <StrokeTest />
        </Suspense>
      ) : null}
      {route === '/' ? (
        <GeminiApp
          onPulseSfx={playUiSfx}
          onPrimeAudio={primeAudio}
          musicEnabled={musicEnabled}
          onToggleMusic={onToggleMusic}
          onAudioSceneChange={handleAudioSceneChange}
        />
      ) : null}
    </>
  )
}

initBleSupport().catch((error) => {
  console.warn('BLE support init failed:', error)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
