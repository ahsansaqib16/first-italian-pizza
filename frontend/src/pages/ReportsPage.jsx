import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Award, Calendar } from 'lucide-react';
import { getSummary, getDaily, getMonthly, getTopProducts, getByCategory } from '../services/reports';
import api from '../services/api';
import { formatDate, currency } from '../utils/format';

const COLORS = ['#ef4444','#f97316','#3b82f6','#22c55e','#8b5cf6','#ec4899'];

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default function ReportsPage() {
  const [tab,       setTab]       = useState('overview');
  const [summary,   setSummary]   = useState(null);
  const [daily,     setDaily]     = useState(null);
  const [monthly,   setMonthly]   = useState(null);
  const [topProds,  setTopProds]  = useState([]);
  const [catData,   setCatData]   = useState([]);
  const [settings,  setSettings]  = useState({});
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, d, m, tp, bc] = await Promise.all([
        getSummary(), getDaily(date), getMonthly(year, month), getTopProducts({ limit: 10 }), getByCategory(),
      ]);
      setSummary(s.data); setDaily(d.data); setMonthly(m.data);
      setTopProds(tp.data); setCatData(bc.data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadDate = () => getDaily(date).then(r => setDaily(r.data));
  const loadMonth= () => getMonthly(year, month).then(r => setMonthly(r.data));

  const sym = settings.currency_symbol || 'Rs';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Sales performance and insights</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Today's Revenue" value={`${sym}${(summary?.todayRevenue || 0).toFixed(2)}`} sub={`${summary?.todayOrders || 0} orders today`} color="bg-green-500" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={summary?.totalOrders || 0} sub="All time" color="bg-blue-500" />
        <StatCard icon={TrendingUp}  label="Total Revenue"  value={`${sym}${(summary?.totalRevenue || 0).toFixed(2)}`} sub="All time" color="bg-brand-500" />
        <StatCard icon={Award} label="Low Stock Items" value={summary?.lowStockCount || 0} sub="Need restocking" color={summary?.lowStockCount > 0 ? 'bg-red-500' : 'bg-gray-400'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {['overview','daily','monthly','products'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by category pie */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={catData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `${sym}${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-12">No data yet</p>}
          </div>

          {/* Top products */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-3">
              {topProds.slice(0,8).map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-5">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${(p.totalSold / (topProds[0]?.totalSold || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{p.totalSold} sold</p>
                    <p className="text-xs text-gray-500">{sym}{p.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily tab */}
      {tab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-44" />
            <button onClick={loadDate} className="btn-primary btn-sm">Load</button>
          </div>
          {daily && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card p-4"><p className="text-sm text-gray-500">Orders</p><p className="text-2xl font-bold">{daily.totalOrders}</p></div>
                <div className="card p-4"><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold text-green-600">{sym}{(daily.totalRevenue||0).toFixed(2)}</p></div>
                <div className="card p-4"><p className="text-sm text-gray-500">Est. Profit</p><p className="text-2xl font-bold text-blue-600">{sym}{(daily.estimatedProfit||0).toFixed(2)}</p></div>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="text-left px-4 py-3 font-semibold">Order</th>
                    <th className="text-left px-4 py-3 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {daily.orders?.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{o.orderNumber}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleTimeString()}</td>
                        <td className="px-4 py-2 capitalize text-gray-600">{o.type}</td>
                        <td className="px-4 py-2 text-right font-semibold">{sym}{o.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly tab */}
      {tab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input w-36">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="input w-24" min="2020" max="2099" />
            <button onClick={loadMonth} className="btn-primary btn-sm">Load</button>
          </div>
          {monthly && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{monthly.totalOrders}</p></div>
                <div className="card p-4"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">{sym}{(monthly.totalRevenue||0).toFixed(2)}</p></div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold mb-4">Daily Revenue Chart</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={d => d.split('-')[2]} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${sym}${v}`} />
                    <Tooltip formatter={v => [`${sym}${v.toFixed(2)}`, 'Revenue']} labelFormatter={l => formatDate(l)} />
                    <Bar dataKey="revenue" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* Products tab */}
      {tab === 'products' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b"><h3 className="font-semibold">Top Products (All Time)</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">#</th>
                <th className="text-left px-4 py-3 font-semibold">Product</th>
                <th className="text-right px-4 py-3 font-semibold">Units Sold</th>
                <th className="text-right px-4 py-3 font-semibold">Orders</th>
                <th className="text-right px-4 py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topProds.map((p, i) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.totalSold}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.orders}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{sym}{p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
