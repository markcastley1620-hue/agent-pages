import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
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
import PublicPortfolio from './pages/PublicPortfolio'
import PublicProperty from './pages/PublicProperty'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Agent workspace (protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
        <Route path="/properties/new" element={<ProtectedRoute><PropertyNew /></ProtectedRoute>} />
        <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
        <Route path="/properties/:id/edit" element={<ProtectedRoute><PropertyEdit /></ProtectedRoute>} />
        <Route path="/portfolio/edit" element={<ProtectedRoute><PortfolioEdit /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Public pages */}
        <Route path="/:agentSlug" element={<PublicPortfolio />} />
        <Route path="/:agentSlug/:propertySlug" element={<PublicProperty />} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
