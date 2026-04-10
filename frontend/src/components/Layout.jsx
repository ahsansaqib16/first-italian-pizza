import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  ShoppingCart, Package, Tag, Layers, BarChart2,
  Users, Settings, LogOut, ClipboardList, Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
       ${isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`
    }
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      api.get('/inventory?lowStock=true').then(r => setLowStockCount(r.data.length)).catch(() => {});
    }
  }, [isAdmin]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍕</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">First Italian</p>
              <p className="text-gray-400 text-xs">Pizza POS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem to="/pos"     icon={ShoppingCart} label="POS / Sale" />
          <NavItem to="/orders"  icon={ClipboardList} label="Orders" />

          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Catalog</p>
              </div>
              <NavItem to="/products"   icon={Package}  label="Products" />
              <NavItem to="/categories" icon={Tag}      label="Categories" />
              <div className="relative">
                <NavItem to="/inventory"  icon={Layers}   label="Inventory" />
                {lowStockCount > 0 && (
                  <span className="absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{lowStockCount}</span>
                )}
              </div>
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Management</p>
              </div>
              <NavItem to="/reports"  icon={BarChart2} label="Reports" />
              <NavItem to="/finance"  icon={Wallet}    label="Finance" />
              <NavItem to="/users"    icon={Users}     label="Users" />
              <NavItem to="/settings" icon={Settings}  label="Settings" />
            </>
          )}
          {!isAdmin && <NavItem to="/reports" icon={BarChart2} label="Reports" />}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
