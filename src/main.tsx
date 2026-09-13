import { StrictMode } from 'react'
import { warmVoices } from './lib/speak'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

warmVoices()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
