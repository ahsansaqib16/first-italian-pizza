import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/products';
import Modal from '../components/Modal';

const EMPTY = { name: '', icon: '🍕', color: '#ef4444', sortOrder: 0 };
const ICONS  = ['🍕','🍔','🌮','🌯','🍟','🥤','🍦','🍩','🥗','🍜','🍣','🍗','🥩','🫓','🧆'];
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f43f5e','#84cc16'];

export default function CategoriesPage() {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    getCategories().then(r => setCats(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (c)  => { setEditing(c); setForm({ name: c.name, icon: c.icon, color: c.color, sortOrder: c.sortOrder }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await updateCategory(editing.id, form);
      else         await createCategory(form);
      toast.success(editing ? 'Category updated' : 'Category created');
      setModal(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Products in it will become uncategorized.')) return;
    try { await deleteCategory(id); toast.success('Deleted'); load(); } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{cats.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Category</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading…</div>
        ) : cats.map(c => (
          <div key={c.id} className="card p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: c.color + '20' }}>
              {c.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-500">{c._count?.products || 0} products</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-xs text-gray-400">{c.color}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => openEdit(c)} className="btn btn-sm btn-ghost"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-ghost text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Pizza" />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm({...form, icon: ic})}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition ${form.icon === ic ? 'border-brand-500 bg-brand-50' : 'border-transparent hover:border-gray-200'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORS.map(col => (
                <button key={col} type="button" onClick={() => setForm({...form, color: col})}
                  className={`w-8 h-8 rounded-full border-4 transition ${form.color === col ? 'border-gray-900 scale-110' : 'border-white'}`}
                  style={{ backgroundColor: col }} />
              ))}
              <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-8 h-8 rounded-full cursor-pointer border-0" />
            </div>
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" min="0" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: Number(e.target.value)})} className="input" />
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
