import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  XCircle, FileText, AlertTriangle, X, Loader2,
  PackageSearch, User, Calendar, Hash, ShoppingCart
} from 'lucide-react';
import { getApiUrl } from '../api';

// ── Types ──────────────────────────────────────────────────────────────────

interface Customer { id: number; name: string; mobileNumber?: string; businessName?: string; }
interface Product  { id: number; name: string; sku: string; unitPrice: number; currentStock: number; }

interface ChallanProduct {
  id: number; productId: number; productName: string;
  productSku: string; unitPrice: number; quantity: number;
}

interface Challan {
  id: number; challanNumber: string; status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number; createdAt: string;
  customer: { name: string };
  createdBy: { name: string; role: string };
  products: ChallanProduct[];
}

interface CartItem { product: Product; quantity: number; }

// ── Small helpers ──────────────────────────────────────────────────────────

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:     { bg: '#fef3c7', color: '#92400e', label: 'Draft' },
  CONFIRMED: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusStyles[status] ?? { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem',
      fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────

interface ToastProps { message: string; type: 'success' | 'error'; onClose: () => void; }
const Toast = ({ message, type, onClose }: ToastProps) => (
  <div style={{
    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
    background: type === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
    color: type === 'error' ? '#991b1b' : '#166534',
    padding: '0.85rem 1.25rem', borderRadius: '10px',
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '420px',
    animation: 'fadeIn 0.3s ease',
  }}>
    {type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
    <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
      <X size={16} />
    </button>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const Challans = () => {
  const { user } = useAuth();

  const [challans,  setChallans]  = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);

  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId,  setSelectedProductId]  = useState('');
  const [addQty, setAddQty] = useState(1);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  // ── Data fetching ──────────────────────────────────────────────────────

  const authHeader = { Authorization: `Bearer ${user?.token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, custRes, prodRes] = await Promise.all([
        axios.get(getApiUrl('/challans'),             { headers: authHeader }),
        axios.get(getApiUrl('/customers?limit=200'),  { headers: authHeader }),
        axios.get(getApiUrl('/products?limit=200'),   { headers: authHeader }),
      ]);
      setChallans(cRes.data.data   ?? cRes.data);
      setCustomers(custRes.data.data ?? custRes.data);
      setProducts(prodRes.data.data  ?? prodRes.data);
    } catch {
      showToast('Failed to load data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Cart helpers ───────────────────────────────────────────────────────

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const p = products.find(x => x.id === Number(selectedProductId));
    if (!p) return;
    const qty = Math.max(1, addQty);
    if (qty > p.currentStock) {
      showToast(`Only ${p.currentStock} units of "${p.name}" available in stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(x => x.product.id === p.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > p.currentStock) {
          showToast(`Cannot add more than ${p.currentStock} units of "${p.name}".`);
          return prev;
        }
        return prev.map(x => x.product.id === p.id ? { ...x, quantity: newQty } : x);
      }
      return [...prev, { product: p, quantity: qty }];
    });
    setSelectedProductId('');
    setAddQty(1);
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(x => {
      if (x.product.id !== productId) return x;
      const next = x.quantity + delta;
      if (next < 1) return x;
      if (next > x.product.currentStock) {
        showToast(`Only ${x.product.currentStock} units available for "${x.product.name}".`);
        return x;
      }
      return { ...x, quantity: next };
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(x => x.product.id !== productId));
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const submitChallan = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!selectedCustomerId) { showToast('Please select a customer.'); return; }
    if (cart.length === 0)   { showToast('Add at least one product to the cart.'); return; }
    setSaving(true);
    try {
      await axios.post(getApiUrl('/challans'), {
        customerId: Number(selectedCustomerId),
        status,
        products: cart.map(item => ({
          productId:   item.product.id,
          productName: item.product.name,
          productSku:  item.product.sku,
          unitPrice:   item.product.unitPrice,
          quantity:    item.quantity,
        })),
      }, { headers: authHeader });

      setShowModal(false);
      setCart([]);
      setSelectedCustomerId('');
      await fetchAll();
      showToast(
        status === 'CONFIRMED'
          ? 'Challan confirmed & stock deducted successfully!'
          : 'Challan saved as draft.',
        'success',
      );
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Failed to create challan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Confirm existing draft ─────────────────────────────────────────────

  const confirmChallan = async (id: number) => {
    try {
      await axios.put(getApiUrl(`/challans/${id}/confirm`), {}, { headers: authHeader });
      await fetchAll();
      showToast('Challan confirmed & stock deducted!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Failed to confirm challan.', 'error');
    }
  };

  const cancelChallan = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this challan?')) return;
    try {
      await axios.put(getApiUrl(`/challans/${id}/cancel`), {}, { headers: authHeader });
      await fetchAll();
      showToast('Challan cancelled.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Failed to cancel challan.', 'error');
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────

  const cartTotal    = cart.reduce((s, i) => s + i.product.unitPrice * i.quantity, 0);
  const cartTotalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const canCreate    = user?.role !== 'ACCOUNTS';

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
            Sales Challans
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {challans.length} challan{challans.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => { setShowModal(true); setCart([]); setSelectedCustomerId(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> New Challan
          </button>
        )}
      </div>

      {/* ── Creation Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            width: '580px', maxWidth: '100vw', height: '100vh',
            background: '#fff', overflowY: 'auto',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '1.5rem', borderBottom: '1px solid var(--surface-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: '#fff', zIndex: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px' }}>
                  <FileText size={20} color="var(--primary-color)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Create Sales Challan</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Number auto-generated on save</div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px' }}
              >
                <X size={22} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Customer select */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} /> Customer *
                </label>
                <select
                  className="form-input"
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">— Select customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.businessName ? ` · ${c.businessName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add product row */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--surface-border)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Add Products
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label className="form-label">Product</label>
                    <select
                      className="form-input"
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                    >
                      <option value="">— Choose product —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.currentStock === 0}>
                          {p.name} · Stock: {p.currentStock}{p.currentStock === 0 ? ' (Out of stock)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ width: '90px', marginBottom: 0 }}>
                    <label className="form-label">Qty</label>
                    <input
                      type="number" min={1} className="form-input"
                      value={addQty}
                      onChange={e => setAddQty(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddToCart}
                    disabled={!selectedProductId}
                    style={{ height: '40px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {/* Stock warning */}
                {selectedProductId && (() => {
                  const p = products.find(x => x.id === Number(selectedProductId));
                  if (!p) return null;
                  if (p.currentStock === 0) return (
                    <div style={{ marginTop: '0.6rem', color: '#b91c1c', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <AlertTriangle size={13} /> This product is out of stock.
                    </div>
                  );
                  if (addQty > p.currentStock) return (
                    <div style={{ marginTop: '0.6rem', color: '#d97706', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <AlertTriangle size={13} /> Only {p.currentStock} unit{p.currentStock !== 1 ? 's' : ''} available.
                    </div>
                  );
                  return (
                    <div style={{ marginTop: '0.6rem', color: '#059669', fontSize: '0.8rem' }}>
                      Available: {p.currentStock} unit{p.currentStock !== 1 ? 's' : ''}
                    </div>
                  );
                })()}
              </div>

              {/* Cart */}
              {cart.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShoppingCart size={14} /> Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
                  </div>
                  <div style={{ border: '1px solid var(--surface-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Product</th>
                          <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Qty</th>
                          <th style={{ padding: '0.65rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Subtotal</th>
                          <th style={{ padding: '0.65rem 0.5rem', width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, i) => (
                          <tr key={item.product.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--surface-border)' }}>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {item.product.sku} · ₹{item.product.unitPrice.toFixed(2)}/unit
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                <button
                                  onClick={() => updateCartQty(item.product.id, -1)}
                                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--surface-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}
                                >−</button>
                                <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQty(item.product.id, +1)}
                                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--surface-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}
                                >+</button>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                              ₹{(item.product.unitPrice * item.quantity).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Cart summary */}
                    <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Total qty: <strong style={{ color: 'var(--text-color)' }}>{cartTotalQty}</strong>
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>
                        Grand Total: ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '2px dashed var(--surface-border)', borderRadius: '10px' }}>
                  <ShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                  <div style={{ fontSize: '0.875rem' }}>No products added yet</div>
                </div>
              )}
            </div>

            {/* Modal footer — action buttons */}
            <div style={{
              padding: '1.25rem 1.5rem', borderTop: '1px solid var(--surface-border)',
              position: 'sticky', bottom: 0, background: '#fff',
              display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn"
                style={{ border: '1px solid var(--surface-border)', background: '#fff', color: 'var(--text-muted)' }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ border: '1px solid var(--primary-color)', background: '#fff', color: 'var(--primary-color)', fontWeight: 600 }}
                onClick={() => submitChallan('DRAFT')}
                disabled={saving || cart.length === 0 || !selectedCustomerId}
              >
                {saving ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                Save as Draft
              </button>
              <button
                className="btn btn-primary"
                onClick={() => submitChallan('CONFIRMED')}
                disabled={saving || cart.length === 0 || !selectedCustomerId}
              >
                {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Challans table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
            <div>Loading challans…</div>
          </div>
        ) : challans.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <PackageSearch size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.4rem' }}>No challans yet</div>
            <div style={{ fontSize: '0.875rem' }}>Create your first sales challan using the button above.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['', 'Challan #', 'Customer', 'Products', 'Total Qty', 'Grand Total', 'Status', 'Created By', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '0.9rem 1rem', textAlign: 'left',
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--surface-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {challans.map(c => {
                const grandTotal = c.products.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
                const isExpanded = expandedId === c.id;
                return (
                  <>
                    <tr
                      key={c.id}
                      style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--surface-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      {/* Expand toggle */}
                      <td style={{ padding: '1rem 0.5rem 1rem 1rem', width: '36px' }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--text-muted)', display: 'flex' }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--primary-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Hash size={13} />{c.challanNumber}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{c.customer?.name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {c.products.length} item{c.products.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{c.totalQuantity}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>
                        ₹{grandTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} />{c.createdBy?.name ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} />
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {c.status === 'DRAFT' && canCreate && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => confirmChallan(c.id)}
                            >
                              <CheckCircle2 size={13} /> Confirm
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => cancelChallan(c.id)}
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          </div>
                        )}
                        {c.status !== 'DRAFT' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded product detail row */}
                    {isExpanded && (
                      <tr key={`${c.id}-expanded`} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td></td>
                        <td colSpan={9} style={{ padding: '0 1rem 1rem 1rem' }}>
                          <div style={{ background: '#f8fafc', border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                  {['#', 'Product', 'SKU', 'Unit Price', 'Quantity', 'Subtotal'].map(h => (
                                    <th key={h} style={{ padding: '0.6rem 0.85rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {c.products.map((p, idx) => (
                                  <tr key={p.id} style={{ borderTop: '1px solid var(--surface-border)' }}>
                                    <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                                    <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, fontSize: '0.85rem' }}>{p.productName}</td>
                                    <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.productSku}</td>
                                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>₹{p.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}>{p.quantity}</td>
                                    <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>₹{(p.unitPrice * p.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Spin keyframe for loader */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};

export default Challans;
