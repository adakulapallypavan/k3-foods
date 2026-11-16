export interface Variant {
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price?: number;
  variants?: Variant[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  variant?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered';

export interface BillRequest {
  id: string;
  tableNumber: number;
  requestedAt: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  note: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
}
