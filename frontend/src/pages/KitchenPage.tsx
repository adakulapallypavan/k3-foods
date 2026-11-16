import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order, OrderStatus, BillRequest } from '../types';

const BROWN = '#3d1a00';
const ORANGE = '#e07820';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; nextLabel?: string; nextColor?: string }> = {
  received: { label: 'New Order', color: '#dc3545', next: 'preparing', nextLabel: 'Start Preparing', nextColor: '#198754' },
  preparing: { label: 'Preparing', color: '#ffc107', next: 'ready', nextLabel: 'Mark Ready', nextColor: '#0d6efd' },
  ready: { label: 'Ready', color: '#0d6efd', next: 'delivered', nextLabel: 'Mark Delivered', nextColor: ORANGE },
  delivered: { label: 'Delivered', color: '#6c757d' },
};

function elapsed(createdAt: string) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [billRequests, setBillRequests] = useState<BillRequest[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, [tick]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('orders_init', (data: Order[]) => setOrders(data));
    socket.on('bill_requests_init', (data: BillRequest[]) => setBillRequests(data));
    socket.on('bill_request', (req: BillRequest) => setBillRequests(prev => [...prev, req]));
    socket.on('bill_request_dismissed', (id: string) => setBillRequests(prev => prev.filter(r => r.id !== id)));

    socket.on('new_order', (order: Order) => {
      setOrders(prev => [...prev, order]);
      setFlashIds(prev => new Set([...prev, order.id]));
      setTimeout(() => {
        setFlashIds(prev => { const s = new Set(prev); s.delete(order.id); return s; });
      }, 3000);
    });

    socket.on('order_updated', (updated: Order) => {
      setOrders(prev => updated.status === 'delivered'
        ? prev.filter(o => o.id !== updated.id)
        : prev.map(o => o.id === updated.id ? updated : o)
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  async function dismissBill(id: string) {
    await fetch(`/api/bill-request/${id}`, { method: 'DELETE' });
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (status === 'delivered') {
      await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    }
  }

  const sorted = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', color: '#fff' }}>
      {/* Header */}
      <div style={{ background: BROWN, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>K3 Foods — Kitchen</div>
          <div style={{ fontSize: 12, color: ORANGE, fontWeight: 600 }}>Bombay Express · Live Orders</div>
        </div>
        {orders.length > 0 && (
          <div style={{ background: '#dc3545', color: '#fff', borderRadius: 20, padding: '5px 14px', fontWeight: 700, fontSize: 14 }}>
            {orders.length} active
          </div>
        )}
      </div>

      {billRequests.length > 0 && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {billRequests.map(req => (
            <div key={req.id} style={{ background: '#fff3cd', border: '2px solid #ffc107', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🧾</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#7d4e00', fontSize: 15 }}>Table {req.tableNumber} — Bill Requested</div>
                  <div style={{ fontSize: 12, color: '#a07000' }}>{elapsed(req.requestedAt)}</div>
                </div>
              </div>
              <button onClick={() => dismissBill(req.id)} style={{ background: '#ffc107', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 16 }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#666' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>No active orders</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Waiting for orders from customers...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {sorted.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              const isFlash = flashIds.has(order.id);
              return (
                <div key={order.id} className={isFlash ? 'new-order-flash' : ''} style={{
                  background: '#fff', borderRadius: 16, overflow: 'hidden',
                  boxShadow: isFlash ? `0 0 0 3px ${ORANGE}, 0 4px 20px rgba(0,0,0,0.3)` : '0 2px 12px rgba(0,0,0,0.2)',
                  color: '#1a1a1a', animation: 'slideIn 0.3s ease',
                  transition: 'box-shadow 0.3s',
                }}>
                  {/* Card Header */}
                  <div style={{ background: BROWN, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ background: ORANGE, color: '#fff', borderRadius: 10, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>
                        {order.tableNumber}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Table {order.tableNumber}</div>
                        <div style={{ color: '#c0a080', fontSize: 12 }}>{elapsed(order.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ background: cfg.color, color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {cfg.label}
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '12px 16px' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f0e8dc' : 'none' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.qty}× {item.name}</span>
                        <span style={{ color: ORANGE, fontWeight: 700, fontSize: 14 }}>₹{item.price * item.qty}</span>
                      </div>
                    ))}

                    {order.note && (
                      <div style={{ marginTop: 10, background: '#fff8f0', border: `1px solid ${ORANGE}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#a05010' }}>
                        <strong>Note:</strong> {order.note}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '2px solid #f0e8dc' }}>
                      <span style={{ fontWeight: 700, color: BROWN }}>Total</span>
                      <span style={{ fontWeight: 800, color: ORANGE, fontSize: 16 }}>₹{order.total}</span>
                    </div>
                  </div>

                  {/* Action */}
                  {cfg.next && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <button onClick={() => updateStatus(order.id, cfg.next!)} style={{
                        width: '100%', background: cfg.nextColor, color: '#fff', border: 'none',
                        borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      }}>
                        {cfg.nextLabel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
