import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  Plus, Edit2, Trash2, TrendingUp, TrendingDown,
  DollarSign, Wallet, BarChart2, Calendar
} from 'lucide-react';
import { getExpenses, getExpenseSummary, createExpense, updateExpense, deleteExpense } from '../services/expenses';
import Modal from '../components/Modal';
import { formatDate } from '../utils/format';
import api from '../services/api';

const EXPENSE_CATEGORIES = ['Rent','Salaries','Utilities','Supplies','Marketing','Maintenance','Food Cost','Transport','Other'];
const CAT_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#94a3b8'];
const EMPTY = { title: '', amount: '', category: 'General', description: '', date: new Date().toISOString().split('T')[0] };

const StatCard = ({ icon: Icon, label, value, sub, color, textColor }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className={`text-2xl font-bold ${textColor || 'text-gray-900'}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function FinancePage() {
  const [expenses,  setExpenses]  = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [settings,  setSettings]  = useState({ currency_symbol: 'Rs' });
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState('overview');
  const [filterCat, setFilterCat] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const sym = settings.currency_symbol || 'Rs';

  const load = async () => {
    const params = {};
    if (filterCat) params.category = filterCat;
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
    const [eRes, sRes] = await Promise.all([
      getExpenses(params),
      getExpenseSummary(params),
    ]).catch(() => [{ data: { expenses: [], totalAmount: 0 } }, { data: null }]);
    setExpenses(eRes.data.expenses || []);
    setSummary(sRes.data);
  };

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [filterCat, startDate, endDate]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (e)  => {
    setEditing(e);
    setForm({ title: e.title, amount: e.amount, category: e.category, description: e.description, date: e.date.split('T')[0] });
    setModal(true);
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      if (editing) await updateExpense(editing.id, form);
      else         await createExpense(form);
      toast.success(editing ? 'Expense updated' : 'Expense added');
      setModal(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await deleteExpense(id); toast.success('Deleted'); load(); } catch {}
  };

  const fmt = (n) => `${sym} ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500">Revenue, expenses & profit tracking</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Expense</button>
      </div>

      {/* Date filter */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={15} />Filter by date:</div>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-40 text-sm" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-40 text-sm" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input w-40 text-sm">
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(startDate || endDate || filterCat) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setFilterCat(''); }} className="btn-secondary btn-sm">Clear</button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={TrendingUp}   label="Total Revenue"   value={fmt(summary.totalRevenue)}  color="bg-green-500"  textColor="text-green-700" />
          <StatCard icon={TrendingDown} label="Total Expenses"  value={fmt(summary.totalExpenses)} color="bg-red-500"    textColor="text-red-700" />
          <StatCard icon={DollarSign}   label="Net Profit"      value={fmt(summary.netProfit)}
            color={summary.netProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}
            textColor={summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}
            sub={`${summary.profitMargin}% margin`} />
          <StatCard icon={Wallet} label="Total Expenses Count" value={expenses.length} color="bg-purple-500" sub="tracked expenses" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {['overview', 'expenses'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses bar */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
            {summary ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { name: 'Revenue',  amount: summary.totalRevenue,  fill: '#22c55e' },
                  { name: 'Expenses', amount: summary.totalExpenses, fill: '#ef4444' },
                  { name: 'Profit',   amount: Math.max(0, summary.netProfit), fill: '#3b82f6' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${sym}${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="amount" radius={[6,6,0,0]}>
                    {[{ fill:'#22c55e'},{ fill:'#ef4444'},{ fill:'#3b82f6'}].map((c, i) => (
                      <Cell key={i} fill={c.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-12">No data yet</p>}
          </div>

          {/* Expenses by category pie */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Expenses by Category</h3>
            {summary?.byCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={summary.byCategory} dataKey="amount" nameKey="category"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {summary.byCategory.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <BarChart2 size={40} strokeWidth={1} className="mb-2" />
                <p>No expenses recorded yet</p>
              </div>
            )}
          </div>

          {/* Category breakdown table */}
          {summary?.byCategory?.length > 0 && (
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown by Category</h3>
              <div className="space-y-3">
                {summary.byCategory.map((c, i) => {
                  const pct = summary.totalExpenses > 0 ? (c.amount / summary.totalExpenses * 100) : 0;
                  return (
                    <div key={c.category} className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className="text-sm font-medium text-gray-700 w-28 truncate">{c.category}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-28 text-right">{fmt(c.amount)}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No expenses recorded yet. Click "Add Expense" to start.</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-red-50 text-red-700">{e.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(e.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(e)} className="btn btn-sm btn-ghost"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(e.id)} className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {expenses.length > 0 && (
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={4} className="px-4 py-3 font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600 text-base">
                    {fmt(expenses.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Expense' : 'Add Expense'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="input" placeholder="e.g. Monthly Rent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({sym}) *</label>
              <input required type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="label">Date *</label>
              <input required type="date" value={form.date}
                onChange={e => setForm({...form, date: e.target.value})} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="input resize-none" rows={2} placeholder="Optional notes…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
