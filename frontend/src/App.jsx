import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing.jsx'

// Lazy-load every non-landing route — keeps the entry bundle small
const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const Loading = lazy(() => import('./pages/Loading.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const Preview = lazy(() => import('./pages/Preview.jsx'))
const Results = lazy(() => import('./pages/Results.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))

function RouteFallback() {
  return (
    <main className="page fluz-style" style={{ minHeight: '100vh' }}>
      <div className="route-fallback" aria-label="Loading">
        <div className="drop-spinner" />
      </div>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <a href="#main" className="skip-link">Skip to content</a>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/results" element={<Results />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
