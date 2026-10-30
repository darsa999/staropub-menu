import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-georgian/georgian-400.css'
import '@fontsource/noto-sans-georgian/latin-400.css'
import '@fontsource/noto-sans-georgian/georgian-500.css'
import '@fontsource/noto-sans-georgian/latin-500.css'
import '@fontsource/noto-sans-georgian/georgian-600.css'
import '@fontsource/noto-sans-georgian/latin-600.css'
import '@fontsource/noto-sans-georgian/georgian-700.css'
import '@fontsource/noto-sans-georgian/latin-700.css'
import '@fontsource/noto-sans-georgian/georgian-800.css'
import '@fontsource/noto-sans-georgian/latin-800.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
