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
import PublicDevelopment from './pages/PublicDevelopment'
import Home from './pages/Home'
import Admin from './pages/Admin'
import DomainSettings from './pages/DomainSettings'
import Developments from './pages/Developments'
import DevelopmentNew from './pages/DevelopmentNew'
import DevelopmentEdit from './pages/DevelopmentEdit'
import Pricing from './pages/Pricing'

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
            <PropertyNew />
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
            <AppShell
              activeNav="portfolio"
              variant="breadcrumb"
              breadcrumb={{ parent: 'Portfolio', parentHref: '/portfolio/edit', current: 'Edit' }}
              rightActions={
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('portfolio:publish'))}
                  style={{
                    padding: '7px 14px', background: 'var(--accent, #2d5a4f)', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover, #234a40)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent, #2d5a4f)'}
                >
                  Publish changes
                </button>
              }
            >
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

        <Route path="/settings/domain" element={
          <ProtectedRoute>
            <AppShell activeNav="settings">
              <DomainSettings />
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

        <Route path="/developments" element={
          <ProtectedRoute>
            <AppShell activeNav="developments">
              <Developments />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/developments/new" element={
          <ProtectedRoute>
            <DevelopmentNew />
          </ProtectedRoute>
        } />

        <Route path="/developments/:id/edit" element={
          <ProtectedRoute>
            <DevelopmentEdit />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Public pricing page */}
        <Route path="/pricing" element={<Pricing />} />

        {/* Default */}
        <Route path="/" element={<Home />} />

        {/* Public pages — MUST be last to avoid catching /dashboard, /properties etc */}
        <Route path="/p/:agentSlug" element={<PublicPortfolio />} />
        <Route path="/p/:agentSlug/:propertySlug" element={<PublicProperty />} />
        <Route path="/d/:agentSlug/:devSlug" element={<PublicDevelopment />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
