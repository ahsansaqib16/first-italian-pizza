import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../services/products';
import Modal from '../components/Modal';
import { currency } from '../utils/format';

const EMPTY = { name: '', description: '', price: '', cost: '', categoryId: '', barcode: '', isActive: true };

export default function ProductsPage() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('');
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [imageFile,  setImageFile]  = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setModal(true); };
  const openEdit   = (p)  => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, cost: p.cost, categoryId: p.categoryId, barcode: p.barcode, isActive: p.isActive });
    setImageFile(null);
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (editing) await updateProduct(editing.id, fd);
      else         await createProduct(fd);

      toast.success(editing ? 'Product updated' : 'Product created');
      setModal(false);
      load();
    } catch { /* toast shown */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); toast.success('Deleted'); load(); } catch {}
  };

  const filtered = products.filter(p =>
    (!filterCat || p.categoryId === Number(filterCat)) &&
    (!search    || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} total products</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="input pl-9 text-sm" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input w-44 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Price</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Cost</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Margin</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
            ) : filtered.map(p => {
              const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(1) : 0;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">{p.category?.icon || '📦'}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.barcode && <p className="text-xs text-gray-400">#{p.barcode}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ backgroundColor: p.category?.color + '20', color: p.category?.color }}>
                      {p.category?.icon} {p.category?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">Rs {p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">Rs {p.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${margin > 50 ? 'text-green-600' : margin > 30 ? 'text-yellow-600' : 'text-red-500'}`}>{margin}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="btn btn-sm btn-ghost"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Margherita Pizza" />
            </div>
            <div>
              <label className="label">Price *</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input" placeholder="9.99" />
            </div>
            <div>
              <label className="label">Cost</label>
              <input type="number" step="0.01" min="0" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input" placeholder="2.50" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="input">
                <option value="">Select…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Barcode</label>
              <input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="input" placeholder="12345678" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input resize-none" rows={2} />
            </div>
            <div className="col-span-2">
              <label className="label">Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="input" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 accent-brand-600" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible in POS)</label>
            </div>
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
