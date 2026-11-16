import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import KitchenPage from './pages/KitchenPage';
import QRPage from './pages/QRPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/qr" element={<QRPage />} />
        <Route path="*" element={<Navigate to="/menu?table=1" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
