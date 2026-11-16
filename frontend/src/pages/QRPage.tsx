import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const BROWN = '#3d1a00';
const ORANGE = '#e07820';
const BASE_URL = window.location.origin;
const TABLE_COUNT = 20;

export default function QRPage() {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    canvasRefs.current.forEach((canvas, i) => {
      if (!canvas) return;
      const tableNum = i + 1;
      QRCode.toCanvas(canvas, `${BASE_URL}/menu?table=${tableNum}`, {
        width: 180,
        margin: 2,
        color: { dark: BROWN, light: '#ffffff' },
      });
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', padding: 24 }}>
      <div className="no-print" style={{ background: BROWN, color: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>QR Code Generator</h1>
          <p style={{ fontSize: 14, color: '#c0a080', marginTop: 4 }}>K3 Foods Bombay Express — {TABLE_COUNT} tables</p>
        </div>
        <button onClick={() => window.print()} style={{
          background: ORANGE, color: '#fff', border: 'none', borderRadius: 24,
          padding: '10px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          Print All QR Codes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(tableNum => (
          <div key={tableNum} className="qr-block" style={{
            background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `2px solid #e0d4c0`,
          }}>
            <div style={{ background: BROWN, color: '#fff', borderRadius: 10, padding: '6px 0', marginBottom: 14, fontWeight: 800, fontSize: 15 }}>
              Table {tableNum}
            </div>
            <canvas ref={el => { canvasRefs.current[tableNum - 1] = el; }} style={{ borderRadius: 8 }} />
            <div style={{ marginTop: 10, fontSize: 12, color: '#888' }}>Scan to Order</div>
            <div style={{ marginTop: 4, fontSize: 11, color: ORANGE, fontWeight: 600 }}>K3 Foods Bombay Express</div>
          </div>
        ))}
      </div>
    </div>
  );
}
