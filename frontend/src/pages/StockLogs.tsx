import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface StockLog {
  id: number;
  product: { name: string, sku: string };
  quantity: number;
  movementType: string;
  reason: string | null;
  createdBy: { name: string };
  createdAt: string;
}

const StockLogs = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/products/stock-logs', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Stock Movement Logs</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track all inventory IN and OUT movements.</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product</th>
              <th>Movement</th>
              <th>Qty</th>
              <th>Reason</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.product.name} ({log.product.sku})</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                    background: log.movementType === 'IN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                    color: log.movementType === 'IN' ? '#10b981' : '#ef4444' 
                  }}>
                    {log.movementType}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{log.quantity}</td>
                <td>{log.reason || '-'}</td>
                <td>{log.createdBy.name}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No stock movements recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockLogs;
