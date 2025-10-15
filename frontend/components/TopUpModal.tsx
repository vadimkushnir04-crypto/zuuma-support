// frontend/components/TopUpModal.tsx
"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  if (!isOpen) return null;

const handleTopUp = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('auth_token'); // ← Исправлено
    const res = await fetch(`${API_URL}/api/tokens/topup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount,
        paymentMeta: { method: 'test', timestamp: new Date() }
      })
    });
    
    if (res.ok) {
      onSuccess();
      onClose();
    }
  } catch (error) {
    console.error('Top-up failed:', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Пополнить баланс</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body">
          <label>Количество токенов</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            min="10000"
            step="10000"
          />
          <div className="price-info">
            Стоимость: {(amount / 1000 * 0.01).toFixed(2)} USD
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} disabled={loading}>Отмена</button>
          <button onClick={handleTopUp} disabled={loading}>
            {loading ? 'Обработка...' : 'Пополнить'}
          </button>
        </div>
      </div>
    </div>
  );
}