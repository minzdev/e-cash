import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import POS from './pages/POS'
import Products from './pages/Products'
import PublicReceipt from './pages/PublicReceipt'
import Reports from './pages/Reports'
import Finance from './pages/Finance'
import SalesPersons from './pages/SalesPersons'
import SettingsPage from './pages/Settings'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/r/:saleId" element={<PublicReceipt />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="kasir" element={<POS />} />
          <Route path="produk" element={<Products />} />
          <Route path="transaksi" element={<Transactions />} />
          <Route path="sales" element={<SalesPersons />} />
          <Route path="keuangan" element={<Finance />} />
          <Route path="laporan" element={<Reports />} />
          <Route path="pengaturan" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
