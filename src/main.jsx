import React from 'react'
import ReactDOM from 'react-dom/client'
import GeminiApp from './GeminiApp.jsx'
import StrokeTest from './StrokeTest.jsx'
import './index.css'

function Root() {
  const path = window.location.pathname || '/'
  const params = new URLSearchParams(window.location.search || '')
  const isDebug = path.startsWith('/debug') || params.get('debug') === '1'
  return isDebug ? <StrokeTest /> : <GeminiApp />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
