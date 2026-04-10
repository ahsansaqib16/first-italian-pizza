import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage     from './pages/LoginPage';
import POSPage       from './pages/POSPage';
import OrdersPage    from './pages/OrdersPage';
import ProductsPage  from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage   from './pages/ReportsPage';
import FinancePage   from './pages/FinancePage';
import UsersPage     from './pages/UsersPage';
import SettingsPage  from './pages/SettingsPage';

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const user = useAuthStore(s => s.user);
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/pos" replace />} />
        <Route path="pos"        element={<POSPage />} />
        <Route path="orders"     element={<OrdersPage />} />
        <Route path="products"   element={<RequireAdmin><ProductsPage /></RequireAdmin>} />
        <Route path="categories" element={<RequireAdmin><CategoriesPage /></RequireAdmin>} />
        <Route path="inventory"  element={<RequireAdmin><InventoryPage /></RequireAdmin>} />
        <Route path="reports"    element={<ReportsPage />} />
        <Route path="finance"    element={<RequireAdmin><FinancePage /></RequireAdmin>} />
        <Route path="users"      element={<RequireAdmin><UsersPage /></RequireAdmin>} />
        <Route path="settings"   element={<RequireAdmin><SettingsPage /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
}
