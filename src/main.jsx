import React from 'react'
import ReactDOM from 'react-dom/client'
import StrokeTest from './StrokeTest.jsx' // 引入新的測試頁面
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StrokeTest />
  </React.StrictMode>,
)
