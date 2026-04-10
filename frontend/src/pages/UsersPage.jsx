import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/format';
import { useAuthStore } from '../store/authStore';

const EMPTY = { name: '', email: '', password: '', role: 'cashier', isActive: true };

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const currentUser = useAuthStore(s => s.user);

  const load = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (u)  => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) await api.put(`/users/${editing.id}`, payload);
      else         await api.post('/users', payload);
      toast.success(editing ? 'User updated' : 'User created');
      setModal(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) { toast.error("Can't delete your own account"); return; }
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('Deleted'); load(); } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{users.length} users</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add User</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading…</div>
        ) : users.map(u => (
          <div key={u.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${u.role === 'admin' ? 'bg-purple-600' : 'bg-brand-600'}`}>
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(u)} className="btn btn-sm btn-ghost"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(u.id)} className="btn btn-sm btn-ghost text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge flex items-center gap-1 ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {u.role === 'admin' ? <Shield size={11} /> : <User size={11} />}
                {u.role}
              </span>
              <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {u.isActive ? 'Active' : 'Inactive'}
              </span>
              {u.id === currentUser?.id && (
                <span className="badge bg-brand-100 text-brand-700">You</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Joined {formatDate(u.createdAt)}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit User' : 'Add User'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" />
          </div>
          <div>
            <label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input
              type="password" minLength={editing ? 0 : 4}
              required={!editing}
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="input" placeholder={editing ? '(unchanged)' : 'Min 4 characters'}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input">
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="uActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 accent-brand-600" />
            <label htmlFor="uActive" className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
