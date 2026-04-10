import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Store, Receipt, Percent } from 'lucide-react';
import api from '../services/api';

const DEFAULTS = {
  shop_name:      'First Italian Pizza',
  shop_address:   '',
  shop_phone:     '',
  shop_email:     '',
  currency:       'PKR',
  currency_symbol:'Rs',
  tax_rate:       '0',
  receipt_footer: 'Thank you for your order!',
  print_receipt:  'true',
};

export default function SettingsPage() {
  const [form,    setForm]    = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setForm({ ...DEFAULTS, ...r.data })).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', form);
      toast.success('Settings saved');
    } catch {}
    finally { setSaving(false); }
  };

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Configure your shop settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Shop Info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Shop Information</h2>
          </div>
          <div className="grid gap-4">
            <div>
              <label className="label">Shop Name</label>
              <input value={form.shop_name} onChange={e => set('shop_name', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Address</label>
              <input value={form.shop_address} onChange={e => set('shop_address', e.target.value)} className="input" placeholder="123 Main St, City" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input value={form.shop_phone} onChange={e => set('shop_phone', e.target.value)} className="input" placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.shop_email} onChange={e => set('shop_email', e.target.value)} className="input" />
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Tax */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Currency & Tax</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Currency Code</label>
              <input value={form.currency} onChange={e => set('currency', e.target.value)} className="input" placeholder="USD" />
            </div>
            <div>
              <label className="label">Currency Symbol</label>
              <input value={form.currency_symbol} onChange={e => set('currency_symbol', e.target.value)} className="input" placeholder="$" />
            </div>
            <div>
              <label className="label">Default Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Receipt */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Receipt</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Receipt Footer Message</label>
              <textarea value={form.receipt_footer} onChange={e => set('receipt_footer', e.target.value)} className="input resize-none" rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="autoPrint" checked={form.print_receipt === 'true'}
                onChange={e => set('print_receipt', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-brand-600" />
              <label htmlFor="autoPrint" className="text-sm text-gray-700">Auto-print receipt after each sale</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary btn-lg">
            <Save size={18} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
