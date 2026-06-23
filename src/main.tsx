import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CloudflareAnalytics } from './components/CloudflareAnalitycs.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <CloudflareAnalytics />
  </StrictMode>,
)
