import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import PropertyNew from './pages/PropertyNew'
import PropertyDetail from './pages/PropertyDetail'
import PropertyEdit from './pages/PropertyEdit'
import PortfolioEdit from './pages/PortfolioEdit'
import Leads from './pages/Leads'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import Analytics from './pages/Analytics'
import PublicPortfolio from './pages/PublicPortfolio'
import PublicProperty from './pages/PublicProperty'
import Home from './pages/Home'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Agent workspace (protected) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppShell activeNav="dashboard">
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/properties" element={
          <ProtectedRoute>
            <AppShell activeNav="properties">
              <Properties />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/properties/new" element={
          <ProtectedRoute>
            <AppShell activeNav="properties" variant="breadcrumb" breadcrumb={{ parent: 'Properties', parentHref: '/properties', current: 'Add new property' }}>
              <PropertyNew />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/properties/:id" element={
          <ProtectedRoute>
            <AppShell activeNav="properties">
              <PropertyDetail />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/properties/:id/edit" element={
          <ProtectedRoute>
            <AppShell activeNav="properties">
              <PropertyEdit />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/portfolio/edit" element={
          <ProtectedRoute>
            <AppShell activeNav="portfolio" variant="breadcrumb" breadcrumb={{ parent: 'Portfolio', parentHref: '/portfolio/edit', current: 'Edit' }}>
              <PortfolioEdit />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/leads" element={
          <ProtectedRoute>
            <AppShell activeNav="leads">
              <Leads />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <AppShell activeNav="settings">
              <Settings />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <AppShell>
              <Onboarding />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <AppShell activeNav="analytics">
              <Analytics />
            </AppShell>
          </ProtectedRoute>
        } />

        {/* Default */}
        <Route path="/" element={<Home />} />

        {/* Public pages — MUST be last to avoid catching /dashboard, /properties etc */}
        <Route path="/p/:agentSlug" element={<PublicPortfolio />} />
        <Route path="/p/:agentSlug/:propertySlug" element={<PublicProperty />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
