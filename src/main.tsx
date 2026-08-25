import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadAdSense, loadFundingChoices } from './lib/ads.ts'

// The consent manager goes first so it is in place to gate personalised ads before AdSense asks for
// any. Both calls do nothing at all unless a publisher id was configured at build time.
loadFundingChoices()
loadAdSense()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
