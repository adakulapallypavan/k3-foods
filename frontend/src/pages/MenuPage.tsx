import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import menuData from '../data/menu';
import { CartItem, MenuItem } from '../types';

const BROWN = '#3d1a00';
const ORANGE = '#e07820';
const BEIGE = '#f5f0e8';

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get('table') || '1', 10);

  const [activeCategory, setActiveCategory] = useState(menuData[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [note, setNote] = useState('');
  const [ordered, setOrdered] = useState(false);
  const [placing, setPlacing] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function getCartKey(item: MenuItem, variant?: string) {
    return variant ? `${item.id}_${variant}` : item.id;
  }

  function getQty(item: MenuItem, variant?: string) {
    const key = getCartKey(item, variant);
    return cart.find(c => c.id === key)?.qty ?? 0;
  }

  function changeQty(item: MenuItem, delta: number, variant?: string, price?: number) {
    const key = getCartKey(item, variant);
    const finalPrice = price ?? item.price ?? 0;
    setCart(prev => {
      const existing = prev.find(c => c.id === key);
      if (!existing) {
        if (delta < 0) return prev;
        return [...prev, { id: key, name: item.name + (variant ? ` (${variant})` : ''), price: finalPrice, qty: 1, variant }];
      }
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter(c => c.id !== key);
      return prev.map(c => c.id === key ? { ...c, qty: newQty } : c);
    });
  }

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveCategory(e.target.id);
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.values(categoryRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function placeOrder() {
    setPlacing(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, items: cart, note }),
      });
      setOrdered(true);
      setCart([]);
      setShowCart(false);
    } catch {
      alert('Could not place order. Please try again.');
    }
    setPlacing(false);
  }

  if (ordered) {
    return (
      <div style={{ minHeight: '100vh', background: BEIGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ color: BROWN, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Order Placed!</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>Your food will be prepared and delivered to Table {tableNumber} shortly.</p>
        <button onClick={() => setOrdered(false)} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 24, padding: '12px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          Order More
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, paddingBottom: totalItems > 0 ? 80 : 0 }}>
      {/* Header */}
      <div style={{ background: BROWN, color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>K3 Foods</div>
          <div style={{ fontSize: 11, color: ORANGE, fontWeight: 600 }}>Bombay Express</div>
        </div>
        <div style={{ background: ORANGE, color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>
          Table {tableNumber}
        </div>
      </div>

      {/* Category Tabs */}
      <div ref={tabsRef} style={{ background: '#fff', overflowX: 'auto', display: 'flex', gap: 0, position: 'sticky', top: 56, zIndex: 99, borderBottom: '1px solid #e0d4c0', scrollbarWidth: 'none' }}>
        {menuData.map(cat => (
          <button key={cat.id} onClick={() => scrollToCategory(cat.id)} style={{
            flexShrink: 0, padding: '10px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeCategory === cat.id ? BROWN : '#fff',
            color: activeCategory === cat.id ? '#fff' : BROWN,
            borderBottom: activeCategory === cat.id ? `3px solid ${ORANGE}` : '3px solid transparent',
            transition: 'all 0.2s',
          }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Sections */}
      <div style={{ padding: '0 0 16px' }}>
        {menuData.map(cat => (
          <div key={cat.id} id={cat.id} ref={el => { categoryRefs.current[cat.id] = el; }} style={{ scrollMarginTop: 110 }}>
            <div style={{ background: BROWN, color: '#fff', padding: '10px 16px', fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
              {cat.name}
            </div>
            {cat.items.map(item => (
              <ItemRow key={item.id} item={item} getQty={getQty} changeQty={changeQty} />
            ))}
          </div>
        ))}
      </div>

      {/* Cart Bar */}
      {totalItems > 0 && (
        <div onClick={() => setShowCart(true)} style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: ORANGE, color: '#fff',
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', boxShadow: '0 -2px 12px rgba(0,0,0,0.2)', zIndex: 200, animation: 'slideIn 0.3s ease',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{totalItems} item{totalItems > 1 ? 's' : ''} | ₹{totalPrice}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>View Order →</span>
        </div>
      )}

      {/* Order Modal */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', width: '100%', maxHeight: '85vh', borderRadius: '20px 20px 0 0', overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: BROWN, fontSize: 20, fontWeight: 800 }}>Your Order</h2>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            <div style={{ marginBottom: 4, color: '#888', fontSize: 13 }}>Table {tableNumber}</div>

            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0e8dc' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: BROWN }}>{item.name}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>₹{item.price} × {item.qty}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: BROWN, fontSize: 14 }}>₹{item.price * item.qty}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', color: BROWN, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Special Instructions (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. less spicy, no onion..." rows={3}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: 10, fontSize: 14, resize: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '12px 0', borderTop: '2px solid #f0e8dc' }}>
              <span style={{ fontWeight: 700, color: BROWN, fontSize: 16 }}>Total</span>
              <span style={{ fontWeight: 800, color: ORANGE, fontSize: 18 }}>₹{totalPrice}</span>
            </div>

            <button onClick={placeOrder} disabled={placing} style={{
              width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 24,
              padding: '14px', fontSize: 16, fontWeight: 700, cursor: placing ? 'not-allowed' : 'pointer',
              opacity: placing ? 0.7 : 1, marginTop: 8,
            }}>
              {placing ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, getQty, changeQty }: {
  item: MenuItem;
  getQty: (item: MenuItem, variant?: string) => number;
  changeQty: (item: MenuItem, delta: number, variant?: string, price?: number) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState(item.variants?.[0]?.label);

  if (item.variants && item.variants.length > 0) {
    const variant = item.variants.find(v => v.label === selectedVariant) ?? item.variants[0];
    const qty = getQty(item, variant.label);
    return (
      <div style={{ background: '#fff', margin: '1px 0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f5ece0' }}>
        <div style={{ flex: 1, marginRight: 8 }}>
          <div style={{ fontWeight: 600, color: BROWN, fontSize: 15 }}>{item.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {item.variants.map(v => (
              <button key={v.label} onClick={() => setSelectedVariant(v.label)} style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 12, border: `1px solid ${selectedVariant === v.label ? ORANGE : '#ddd'}`,
                background: selectedVariant === v.label ? ORANGE : '#fff',
                color: selectedVariant === v.label ? '#fff' : '#666',
                cursor: 'pointer', fontWeight: 600,
              }}>
                {v.label} ₹{v.price}
              </button>
            ))}
          </div>
        </div>
        <QtyControl qty={qty} onAdd={() => changeQty(item, 1, variant.label, variant.price)} onRemove={() => changeQty(item, -1, variant.label, variant.price)} />
      </div>
    );
  }

  const qty = getQty(item);
  return (
    <div style={{ background: '#fff', margin: '1px 0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f5ece0' }}>
      <div>
        <div style={{ fontWeight: 600, color: BROWN, fontSize: 15 }}>{item.name}</div>
        <div style={{ color: ORANGE, fontWeight: 700, fontSize: 14, marginTop: 2 }}>₹{item.price}</div>
      </div>
      <QtyControl qty={qty} onAdd={() => changeQty(item, 1)} onRemove={() => changeQty(item, -1)} />
    </div>
  );
}

function QtyControl({ qty, onAdd, onRemove }: { qty: number; onAdd: () => void; onRemove: () => void }) {
  if (qty === 0) {
    return (
      <button onClick={onAdd} style={{
        background: ORANGE, color: '#fff', border: 'none', borderRadius: 20,
        padding: '7px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>ADD</button>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: ORANGE, borderRadius: 20, padding: '5px 10px' }}>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1, fontWeight: 700 }}>−</button>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>{qty}</span>
      <button onClick={onAdd} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1, fontWeight: 700 }}>+</button>
    </div>
  );
}
