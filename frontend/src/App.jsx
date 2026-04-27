import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing.jsx'

// Lazy-load every non-landing route — keeps the entry bundle small.
// Pages listed in funnel order: marketing → product → account → legal.
const Quiz        = lazy(() => import('./pages/Quiz.jsx'))          // /quiz
const Upload      = lazy(() => import('./pages/Upload.jsx'))        // /upload
const Loading     = lazy(() => import('./pages/Loading.jsx'))       // /loading
const Preview     = lazy(() => import('./pages/Preview.jsx'))       // /preview/:id
const Results     = lazy(() => import('./pages/Results.jsx'))       // /results/:id
const Login       = lazy(() => import('./pages/Login.jsx'))         // /login, /signup
const Dashboard   = lazy(() => import('./pages/Dashboard.jsx'))     // /dashboard
const Terms       = lazy(() => import('./pages/Terms.jsx'))         // /terms
const Privacy     = lazy(() => import('./pages/Privacy.jsx'))       // /privacy

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
          {/* === Marketing === */}
          <Route path="/"          element={<Landing />} />
          {/* /waitlist is a standalone HTML page in public/waitlist/ — handled by Vercel rewrite, not React Router */}

          {/* === Product funnel === */}
          <Route path="/quiz"           element={<Quiz />} />
          <Route path="/upload"         element={<Upload />} />
          <Route path="/loading"        element={<Loading />} />
          <Route path="/preview"        element={<Preview />} />
          <Route path="/preview/:id"    element={<Preview />} />
          <Route path="/results"        element={<Results />} />
          <Route path="/results/:id"    element={<Results />} />
          <Route path="/report/:id"     element={<Results />} />

          {/* === Account === */}
          <Route path="/login"          element={<Login />} />
          <Route path="/signin"         element={<Login />} />
          <Route path="/signup"         element={<Login />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/app"            element={<Dashboard />} />

          {/* === Legal === */}
          <Route path="/terms"          element={<Terms />} />
          <Route path="/privacy"        element={<Privacy />} />

          {/* === Catch-all → home === */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
