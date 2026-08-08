import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import { getApiUrl } from '../api';

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface Challan {
  id: number;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  customer: { name: string };
  createdAt: string;
}

const Challans = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [selectedProductStr, setSelectedProductStr] = useState('');
  const [addQty, setAddQty] = useState(1);

  useEffect(() => {
    fetchChallans();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchChallans = async () => {
    try {
      const { data } = await axios.get(getApiUrl('/challans'), {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setChallans(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get(getApiUrl('/customers?limit=100'), {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setCustomers(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(getApiUrl('/products?limit=100'), {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setProducts(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmChallan = async (id: number) => {
    try {
      await axios.put(getApiUrl(`/challans/${id}/confirm`), {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      fetchChallans();
      fetchProducts();
      alert("Challan confirmed and stock reduced!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm challan");
    }
  };

  const cancelChallan = async (id: number) => {
    try {
      await axios.put(getApiUrl(`/challans/${id}/cancel`), {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      fetchChallans();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel challan");
    }
  };

  const handleAddToCart = () => {
    if (!selectedProductStr) return;
    const p = products.find(x => x.id.toString() === selectedProductStr);
    if (!p) return;
    
    // Check if already in cart
    const existing = cart.find(x => x.product.id === p.id);
    if (existing) {
      setCart(cart.map(x => x.product.id === p.id ? { ...x, quantity: x.quantity + addQty } : x));
    } else {
      setCart([...cart, { product: p, quantity: addQty }]);
    }
    setAddQty(1);
  };

  const removeCartItem = (id: number) => {
    setCart(cart.filter(x => x.product.id !== id));
  };

  const submitChallan = async () => {
    if (!selectedCustomerId || cart.length === 0) {
      alert('Please select a customer and add at least one product.');
      return;
    }
    try {
      const payload = {
        customerId: Number(selectedCustomerId),
        products: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          unitPrice: item.product.unitPrice,
          quantity: item.quantity
        }))
      };
      
      await axios.post(getApiUrl('/challans'), payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      setShowForm(false);
      setCart([]);
      setSelectedCustomerId('');
      fetchChallans();
    } catch (err) {
      console.error(err);
      alert('Failed to create challan');
    }
  };

  const totalPrice = cart.reduce((acc, item) => acc + (item.product.unitPrice * item.quantity), 0);
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Sales Challans</h1>
        {user?.role !== 'ACCOUNTS' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel Creation' : 'Create New Challan'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '1rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Create Sales Challan</h2>
          
          <div className="form-group">
            <label className="form-label">Select Customer</label>
            <select className="form-input" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
              <option value="">-- Choose Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
              <label className="form-label">Select Product</label>
              <select className="form-input" value={selectedProductStr} onChange={e => setSelectedProductStr(e.target.value)}>
                <option value="">-- Choose Product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.currentStock}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Quantity</label>
              <input type="number" min="1" className="form-input" value={addQty} onChange={e => setAddQty(Number(e.target.value))} />
            </div>
            <button className="btn btn-primary" onClick={handleAddToCart} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '45px' }}>
              <Plus size={18} /> Add
            </button>
          </div>

          {cart.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Challan Items</h3>
              <table style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.product.id}>
                      <td>{item.product.name}</td>
                      <td>${item.product.unitPrice.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>${(item.product.unitPrice * item.quantity).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeCartItem(item.product.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '2rem', fontSize: '1.1rem' }}>
                <div>Total Qty: <strong>{totalQty}</strong></div>
                <div>Grand Total: <strong style={{ color: '#10b981' }}>${totalPrice.toFixed(2)}</strong></div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={submitChallan} disabled={cart.length === 0 || !selectedCustomerId}>
              Save Draft Challan
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {challans.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 'bold' }}>{c.challanNumber}</td>
                <td>{c.customer?.name}</td>
                <td>{c.totalQuantity}</td>
                <td>
                  <span className={`status-badge ${c.status === 'CONFIRMED' ? 'status-confirmed' : c.status === 'CANCELLED' ? 'status-cancelled' : 'status-draft'}`}>
                    {c.status}
                  </span>
                </td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>
                  {c.status === 'DRAFT' && user?.role !== 'ACCOUNTS' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => confirmChallan(c.id)}>
                        Confirm
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => cancelChallan(c.id)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {challans.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No challans found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Challans;
