import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, AlertTriangle, PackagePlus } from 'lucide-react';
import { getIngredients, createIngredient, updateIngredient, restockIngredient, deleteIngredient } from '../services/inventory';
import Modal from '../components/Modal';

const EMPTY = { name: '', unit: 'pcs', quantity: '', minStock: 5, cost: '' };
const UNITS  = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'bag'];

export default function InventoryPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [restock, setRestock] = useState(null); // ingredient to restock
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [restockAmt, setRestockAmt] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [showLow, setShowLow] = useState(false);

  const load = () => {
    setLoading(true);
    getIngredients().then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (i)  => { setEditing(i); setForm({ name: i.name, unit: i.unit, quantity: i.quantity, minStock: i.minStock, cost: i.cost }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await updateIngredient(editing.id, form);
      else         await createIngredient(form);
      toast.success(editing ? 'Updated' : 'Created');
      setModal(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleRestock = async () => {
    if (!restockAmt || Number(restockAmt) <= 0) return;
    setSaving(true);
    try {
      await restockIngredient(restock.id, restockAmt);
      toast.success(`Restocked ${restock.name} +${restockAmt}`);
      setRestock(null);
      setRestockAmt('');
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete ingredient?')) return;
    try { await deleteIngredient(id); toast.success('Deleted'); load(); } catch {}
  };

  const displayed = showLow ? items.filter(i => i.quantity <= i.minStock) : items;
  const lowCount  = items.filter(i => i.quantity <= i.minStock).length;

  const stockLevel = (item) => {
    if (item.quantity <= 0)           return { label: 'Out', cls: 'bg-red-100 text-red-700' };
    if (item.quantity <= item.minStock) return { label: 'Low', cls: 'bg-yellow-100 text-yellow-700' };
    return { label: 'OK', cls: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{items.length} ingredients tracked</p>
        </div>
        <div className="flex gap-3">
          {lowCount > 0 && (
            <button onClick={() => setShowLow(!showLow)}
              className={`btn gap-2 ${showLow ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              <AlertTriangle size={15} />
              {lowCount} Low Stock
            </button>
          )}
          <button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Ingredient</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Ingredient</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Quantity</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Min Stock</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Cost/Unit</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                {showLow ? 'No low stock items!' : 'No ingredients yet'}
              </td></tr>
            ) : displayed.map(item => {
              const s = stockLevel(item);
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity <= 0 ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold">{item.quantity}</span>
                    <span className="text-gray-400 ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.minStock} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${item.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setRestock(item); setRestockAmt(''); }} className="btn btn-sm btn-ghost text-green-600 hover:bg-green-50">
                        <PackagePlus size={14} />
                      </button>
                      <button onClick={() => openEdit(item)} className="btn btn-sm btn-ghost"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Ingredient' : 'Add Ingredient'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Unit</label>
              <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Stock Alert</label>
              <input type="number" min="0" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} className="input" />
            </div>
            <div>
              <label className="label">Current Quantity</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input" />
            </div>
            <div>
              <label className="label">Cost per Unit</label>
              <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={!!restock} onClose={() => setRestock(null)} title={`Restock: ${restock?.name}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Current stock: <strong>{restock?.quantity} {restock?.unit}</strong>
          </p>
          <div>
            <label className="label">Amount to add ({restock?.unit})</label>
            <input
              type="number" min="0.01" step="0.01" value={restockAmt}
              onChange={e => setRestockAmt(e.target.value)}
              className="input text-lg font-semibold" placeholder="0" autoFocus
            />
          </div>
          {restockAmt > 0 && (
            <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm">
              New quantity: <strong>{(Number(restock?.quantity) + Number(restockAmt)).toFixed(2)} {restock?.unit}</strong>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setRestock(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleRestock} disabled={saving || !restockAmt} className="btn-success">
              {saving ? 'Saving…' : 'Restock'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
