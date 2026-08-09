import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Edit, Plus, Package, Search, AlertTriangle,
  LayoutGrid, List, X, MapPin, Tag,
  CheckCircle, XCircle, Layers, IndianRupee,
} from 'lucide-react';
import { getApiUrl, getImageUrl } from '../api';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string | null;
  imageUrl: string | null;
}

// ── Stock status helpers ────────────────────────────────────────────────────

function getStockStatus(stock: number, min: number) {
  if (stock === 0) return 'out';
  if (stock <= min) return 'low';
  return 'in';
}

const STATUS_META = {
  out: { label: 'Out of Stock', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  low: { label: 'Low Stock',    bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  in:  { label: 'In Stock',     bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
};

// ── Image component ─────────────────────────────────────────────────────────

const ProductImage = ({
  imageUrl, name, size = 48, radius = 8,
}: { imageUrl: string | null; name: string; size?: number; radius?: number }) => {
  const [errored, setErrored] = useState(false);
  const src = imageUrl ? getImageUrl(imageUrl) : '';
  if (!src || errored) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c',
      }}>
        <Package size={size * 0.45} />
      </div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErrored(true)}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, background: '#f1f5f9' }} />
  );
};

// ── Stock badge ─────────────────────────────────────────────────────────────

const StockBadge = ({ stock, min }: { stock: number; min: number }) => {
  const s = STATUS_META[getStockStatus(stock, min)];
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
      background: s.bg, color: s.color,
      display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

// ── Stock bar ───────────────────────────────────────────────────────────────

const StockBar = ({ stock, min }: { stock: number; min: number }) => {
  const status = getStockStatus(stock, min);
  const max    = Math.max(stock, min * 2, 1);
  const pct    = Math.min(100, Math.round((stock / max) * 100));
  const barColor = status === 'in' ? '#10b981' : status === 'low' ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Stock</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: barColor }}>{stock} units</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: barColor,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
};

// ── Stat mini-card ──────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent: string;
}) => (
  <div style={{
    background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 12,
    padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
    flex: '1 1 140px', minWidth: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: accent + '18', color: accent,
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────

const Products = () => {
  const { user } = useAuth();

  const [products,     setProducts]     = useState<Product[]>([]);
  const [search,       setSearch]       = useState('');
  const [view,         setView]         = useState<'grid' | 'list'>('grid');
  const [stockFilter,  setStockFilter]  = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [showModal,    setShowModal]    = useState(false);
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [saving,       setSaving]       = useState(false);

  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unitPrice: '',
    currentStock: '', minStockAlert: '10', location: '',
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(getApiUrl('/products?limit=200'), {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setProducts(data.data || data);
    } catch (err) { console.error(err); }
  };

  const openAdd = () => {
    setEditingId(null);
    setPreviewUrl(null);
    setImageFile(null);
    setFormData({ name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStockAlert: '10', location: '' });
    setShowModal(true);
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, sku: p.sku, category: p.category || '',
      unitPrice: p.unitPrice.toString(), currentStock: p.currentStock.toString(),
      minStockAlert: p.minStockAlert.toString(), location: p.location || '',
    });
    setPreviewUrl(p.imageUrl ? getImageUrl(p.imageUrl) : null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (imageFile) form.append('image', imageFile);
      const headers = { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' };
      if (editingId) {
        await axios.put(getApiUrl(`/products/${editingId}`), form, { headers });
      } else {
        await axios.post(getApiUrl('/products'), form, { headers });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // ── Derived data ────────────────────────────────────────────────────────

  const inStock  = products.filter(p => p.currentStock > p.minStockAlert);
  const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert);
  const outStock = products.filter(p => p.currentStock === 0);
  const totalValue = products.reduce((s, p) => s + p.unitPrice * p.currentStock, 0);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q);
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'out' && p.currentStock === 0) ||
      (stockFilter === 'low' && p.currentStock > 0 && p.currentStock <= p.minStockAlert) ||
      (stockFilter === 'in'  && p.currentStock > p.minStockAlert);
    return matchesSearch && matchesStock;
  });

  const canEdit = user?.role !== 'SALES';

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '0.2rem' }}>
            Products &amp; Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {products.length} SKUs across your catalogue
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{
            display: 'flex', border: '1px solid var(--surface-border)',
            borderRadius: '8px', overflow: 'hidden', background: '#fff',
          }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v}
                onClick={() => setView(v)}
                title={v === 'grid' ? 'Grid view' : 'List view'}
                style={{
                  padding: '0.48rem 0.8rem', border: 'none', cursor: 'pointer',
                  background: view === v ? 'var(--primary-color)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                  borderLeft: v === 'list' ? '1px solid var(--surface-border)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {v === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
          {canEdit && (
            <button className="btn btn-primary" onClick={openAdd}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: 8, fontWeight: 700 }}>
              <Plus size={17} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard icon={<Layers size={20} />}  label="Total SKUs"     value={products.length} accent="#ea580c" />
        <StatCard icon={<CheckCircle size={20} />} label="In Stock"   value={inStock.length}  accent="#10b981" />
        <StatCard icon={<AlertTriangle size={20} />} label="Low Stock" value={lowStock.length} accent="#f59e0b" />
        <StatCard icon={<XCircle size={20} />} label="Out of Stock"   value={outStock.length} accent="#ef4444" />
        <StatCard icon={<IndianRupee size={20} />} label="Inventory Value"
          value={`₹${totalValue >= 100000 ? (totalValue / 100000).toFixed(1) + 'L' : totalValue.toLocaleString('en-IN')}`}
          accent="#2563eb" />
      </div>

      {/* ── Search + filter bar ── */}
      <div style={{
        background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 12,
        padding: '0.85rem 1rem', marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search name, SKU or category…"
            className="form-input"
            style={{ paddingLeft: '2.1rem', borderRadius: 8, fontSize: '0.875rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--surface-border)', flexShrink: 0 }} />

        {/* Stock pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {([
            { key: 'all', label: 'All',         count: products.length,  accent: '#ea580c' },
            { key: 'in',  label: 'In Stock',     count: inStock.length,   accent: '#10b981' },
            { key: 'low', label: 'Low Stock',    count: lowStock.length,  accent: '#f59e0b' },
            { key: 'out', label: 'Out of Stock', count: outStock.length,  accent: '#ef4444' },
          ] as const).map(({ key, label, count, accent }) => {
            const active = stockFilter === key;
            return (
              <button key={key} onClick={() => setStockFilter(key)} style={{
                padding: '0.3rem 0.75rem', borderRadius: '999px', cursor: 'pointer',
                border: `1.5px solid ${active ? accent : 'var(--surface-border)'}`,
                background: active ? accent + '14' : 'transparent',
                color: active ? accent : 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                transition: 'all 0.15s',
              }}>
                {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />}
                {label}
                <span style={{
                  background: active ? accent + '25' : '#f1f5f9',
                  color: active ? accent : 'var(--text-muted)',
                  borderRadius: '999px', padding: '0 5px', fontSize: '0.68rem', fontWeight: 700,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {(search || stockFilter !== 'all') && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
          {filtered.map(p => {
            const status = getStockStatus(p.currentStock, p.minStockAlert);
            const sm     = STATUS_META[status];
            return (
              <div key={p.id} style={{
                background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s, transform 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                }}
              >
                {/* Image zone */}
                <div style={{
                  height: 170, background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {p.imageUrl ? (
                    <img src={getImageUrl(p.imageUrl)} alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
                      <Package size={44} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>No image</span>
                    </div>
                  )}
                  {/* Status ribbon */}
                  <div style={{
                    position: 'absolute', top: '0.6rem', left: '0.6rem',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: sm.bg, color: sm.color,
                    padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot }} />
                    {sm.label}
                  </div>
                  {/* Edit shortcut */}
                  {canEdit && (
                    <button onClick={() => handleEdit(p)} style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem',
                      background: 'rgba(255,255,255,0.9)', border: '1px solid var(--surface-border)',
                      borderRadius: 7, cursor: 'pointer', padding: '0.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', transition: 'all 0.15s', backdropFilter: 'blur(4px)',
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-color)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-color)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--surface-border)';
                      }}
                    >
                      <Edit size={14} />
                    </button>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, color: 'var(--text-color)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                    {p.sku}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                    {p.category && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600, color: '#ea580c',
                        background: '#fff7ed', padding: '2px 8px', borderRadius: 999,
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <Tag size={9} /> {p.category}
                      </span>
                    )}
                    {p.location && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 500, color: '#64748b',
                        background: '#f1f5f9', padding: '2px 8px', borderRadius: 999,
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <MapPin size={9} /> {p.location}
                      </span>
                    )}
                  </div>

                  {/* Stock bar */}
                  <div style={{ marginTop: '0.25rem' }}>
                    <StockBar stock={p.currentStock} min={p.minStockAlert} />
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--surface-border)', marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.3px' }}>
                      ₹{p.unitPrice.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Val: ₹{(p.unitPrice * p.currentStock).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No products found</div>
              <div style={{ fontSize: '0.85rem' }}>Try adjusting your search or filter.</div>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={{
          background: '#fff', border: '1px solid var(--surface-border)', borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['', 'Product', 'SKU', 'Category', 'Location', 'Price', 'Stock', 'Value', canEdit ? 'Action' : ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.7rem',
                    color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '1px solid var(--surface-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}
                  style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '0.7rem 0.75rem 0.7rem 1rem', width: 56 }}>
                    <ProductImage imageUrl={p.imageUrl} name={p.name} size={44} radius={9} />
                  </td>
                  <td style={{ padding: '0.7rem 1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</div>
                  </td>
                  <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.sku}
                  </td>
                  <td style={{ padding: '0.7rem 1rem' }}>
                    {p.category
                      ? <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: 999 }}>{p.category}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {p.location
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{p.location}</span>
                      : '—'}
                  </td>
                  <td style={{ padding: '0.7rem 1rem', fontWeight: 800, color: '#059669', fontSize: '0.92rem' }}>
                    ₹{p.unitPrice.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.7rem 1rem' }}>
                    <StockBadge stock={p.currentStock} min={p.minStockAlert} />
                    <div style={{ marginTop: 5, width: 80 }}>
                      <StockBar stock={p.currentStock} min={p.minStockAlert} />
                    </div>
                  </td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ₹{(p.unitPrice * p.currentStock).toLocaleString('en-IN')}
                  </td>
                  {canEdit && (
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <button onClick={() => handleEdit(p)} className="btn" style={{
                        padding: '0.28rem 0.65rem', fontSize: '0.76rem',
                        background: 'var(--primary-light)', color: 'var(--primary-color)',
                        border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: 7,
                        fontWeight: 600,
                      }}>
                        <Edit size={12} /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                  <Package size={36} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <div>No products found.</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL FORM ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            width: 560, maxWidth: '100vw', height: '100vh',
            background: '#fff', display: 'flex', flexDirection: 'column',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.12)',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--surface-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: '#fff', zIndex: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: 9 }}>
                  <Package size={20} color="var(--primary-color)" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    {editingId ? 'Edit Product' : 'Add New Product'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {editingId ? 'Update product details' : 'Fill in the details to add to your catalogue'}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                borderRadius: 6, color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}>
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <form id="product-form" onSubmit={handleSubmit}>

                {/* Image preview area */}
                <div style={{
                  border: '2px dashed var(--surface-border)', borderRadius: 12,
                  padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center',
                  background: '#fafbff', position: 'relative',
                }}>
                  {previewUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={previewUrl} alt="preview" style={{
                        width: 80, height: 80, objectFit: 'cover', borderRadius: 10,
                        border: '1px solid var(--surface-border)',
                      }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>Product Image</div>
                        <label style={{
                          fontSize: '0.78rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600,
                        }}>
                          Change image
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <Package size={32} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Click to upload product image
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>PNG, JPG up to 10MB</div>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    </label>
                  )}
                </div>

                {/* Fields grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Product Name *', key: 'name', type: 'text', required: true, col: 'span 2' },
                    { label: 'SKU / Code *',   key: 'sku',  type: 'text', required: true },
                    { label: 'Category',        key: 'category', type: 'text' },
                    { label: 'Location / Warehouse', key: 'location', type: 'text' },
                    { label: 'Unit Price (₹) *', key: 'unitPrice', type: 'number', required: true, step: '0.01' },
                    { label: 'Current Stock *', key: 'currentStock', type: 'number', required: true },
                    { label: 'Min Stock Alert *', key: 'minStockAlert', type: 'number', required: true },
                  ].map(f => (
                    <div key={f.key} className="form-group" style={{ gridColumn: (f as any).col || '', marginBottom: 0 }}>
                      <label className="form-label">{f.label}</label>
                      <input
                        type={f.type}
                        step={(f as any).step}
                        className="form-input"
                        required={f.required}
                        value={(formData as any)[f.key]}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.1rem 1.5rem', borderTop: '1px solid var(--surface-border)',
              display: 'flex', gap: '0.6rem', justifyContent: 'flex-end',
              position: 'sticky', bottom: 0, background: '#fff',
            }}>
              <button onClick={() => setShowModal(false)} className="btn"
                style={{ border: '1px solid var(--surface-border)', background: '#fff', color: 'var(--text-muted)', borderRadius: 8 }}>
                Cancel
              </button>
              <button type="submit" form="product-form" className="btn btn-primary"
                disabled={saving}
                style={{ minWidth: 130, borderRadius: 8, fontWeight: 700 }}>
                {saving
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Saving…
                    </span>
                  : editingId ? 'Update Product' : 'Save Product'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default Products;
