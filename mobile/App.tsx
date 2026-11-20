import { useEffect, useRef, useState } from 'react';
import {
  FlatList, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './config';

const BROWN = '#3d1a00';
const ORANGE = '#e07820';

type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  note: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
}

interface BillRequest {
  id: string;
  tableNumber: number;
  requestedAt: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; nextLabel?: string; nextColor?: string }> = {
  received:  { label: 'New Order',  color: '#dc3545', next: 'preparing', nextLabel: 'Start Preparing', nextColor: '#198754' },
  preparing: { label: 'Preparing',  color: '#ffc107', next: 'ready',     nextLabel: 'Mark Ready',      nextColor: '#0d6efd' },
  ready:     { label: 'Ready',      color: '#0d6efd', next: 'delivered', nextLabel: 'Mark Delivered',  nextColor: ORANGE },
  delivered: { label: 'Delivered',  color: '#6c757d' },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function elapsed(createdAt: string) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

async function registerForPushNotifications() {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } = existing === 'granted'
    ? { status: existing }
    : await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await fetch(`${BACKEND_URL}/api/register-device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => {});
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [billRequests, setBillRequests] = useState<BillRequest[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('orders_init', (data: Order[]) => setOrders(data));
    socket.on('bill_requests_init', (data: BillRequest[]) => setBillRequests(data));

    socket.on('new_order', (order: Order) => {
      setOrders(prev => [...prev, order]);
    });

    socket.on('order_updated', (updated: Order) => {
      setOrders(prev =>
        updated.status === 'delivered'
          ? prev.filter(o => o.id !== updated.id)
          : prev.map(o => o.id === updated.id ? updated : o)
      );
    });

    socket.on('bill_request', (req: BillRequest) =>
      setBillRequests(prev => [...prev, req])
    );
    socket.on('bill_request_dismissed', (id: string) =>
      setBillRequests(prev => prev.filter(r => r.id !== id))
    );

    return () => { socket.disconnect(); };
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (status === 'delivered') {
      await fetch(`${BACKEND_URL}/api/orders/${orderId}`, { method: 'DELETE' });
    } else {
      await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    }
  }

  async function dismissBill(id: string) {
    await fetch(`${BACKEND_URL}/api/bill-request/${id}`, { method: 'DELETE' });
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={BROWN} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>K3 Foods — Kitchen</Text>
          <Text style={styles.headerSub}>Bombay Express · Live Orders</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: connected ? '#198754' : '#dc3545' }]}>
          <Text style={styles.badgeText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Bill Request Alerts */}
        {billRequests.map(req => (
          <View key={req.id} style={styles.billAlert}>
            <View style={{ flex: 1 }}>
              <Text style={styles.billAlertTitle}>🧾 Table {req.tableNumber} — Bill Requested</Text>
              <Text style={styles.billAlertTime}>{elapsed(req.requestedAt)}</Text>
            </View>
            <TouchableOpacity onPress={() => dismissBill(req.id)} style={styles.billDoneBtn}>
              <Text style={styles.billDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Orders */}
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptySub}>Waiting for orders from customers...</Text>
          </View>
        ) : (
          sorted.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            return (
              <View key={order.id} style={styles.card}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.tableNumBox}>
                      <Text style={styles.tableNumText}>{order.tableNumber}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardTableLabel}>Table {order.tableNumber}</Text>
                      <Text style={styles.cardTime}>{elapsed(order.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
                    <Text style={styles.statusBadgeText}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.cardBody}>
                  {order.items.map((item, i) => (
                    <View key={i} style={[styles.itemRow, i < order.items.length - 1 && styles.itemRowBorder]}>
                      <Text style={styles.itemName}>{item.qty}× {item.name}</Text>
                      <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
                    </View>
                  ))}

                  {!!order.note && (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}><Text style={{ fontWeight: '700' }}>Note: </Text>{order.note}</Text>
                    </View>
                  )}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>₹{order.total}</Text>
                  </View>
                </View>

                {/* Action Button */}
                {cfg.next && (
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => updateStatus(order.id, cfg.next!)}
                      style={[styles.actionBtn, { backgroundColor: cfg.nextColor }]}
                    >
                      <Text style={styles.actionBtnText}>{cfg.nextLabel}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#1a1a1a' },
  header:          { backgroundColor: BROWN, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:     { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerSub:       { color: ORANGE, fontWeight: '600', fontSize: 12, marginTop: 2 },
  badge:           { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll:          { flex: 1 },

  billAlert:       { margin: 12, marginBottom: 0, backgroundColor: '#fff3cd', borderWidth: 2, borderColor: '#ffc107', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  billAlertTitle:  { fontWeight: '800', color: '#7d4e00', fontSize: 15 },
  billAlertTime:   { fontSize: 12, color: '#a07000', marginTop: 2 },
  billDoneBtn:     { backgroundColor: '#ffc107', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 12 },
  billDoneBtnText: { fontWeight: '700', color: '#fff', fontSize: 13 },

  empty:           { alignItems: 'center', paddingTop: 100 },
  emptyIcon:       { fontSize: 52, marginBottom: 12 },
  emptyTitle:      { color: '#888', fontSize: 18, fontWeight: '600' },
  emptySub:        { color: '#555', fontSize: 14, marginTop: 4 },

  card:            { margin: 12, marginBottom: 0, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  cardHeader:      { backgroundColor: BROWN, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tableNumBox:     { backgroundColor: ORANGE, borderRadius: 10, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  tableNumText:    { color: '#fff', fontWeight: '900', fontSize: 20 },
  cardTableLabel:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardTime:        { color: '#c0a080', fontSize: 12, marginTop: 1 },
  statusBadge:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  statusBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  cardBody:        { padding: 14 },
  itemRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  itemRowBorder:   { borderBottomWidth: 1, borderBottomColor: '#f0e8dc' },
  itemName:        { fontWeight: '600', fontSize: 14, color: BROWN, flex: 1 },
  itemPrice:       { color: ORANGE, fontWeight: '700', fontSize: 14 },
  noteBox:         { marginTop: 10, backgroundColor: '#fff8f0', borderWidth: 1, borderColor: ORANGE, borderRadius: 8, padding: 10 },
  noteText:        { fontSize: 13, color: '#a05010' },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#f0e8dc' },
  totalLabel:      { fontWeight: '700', color: BROWN, fontSize: 15 },
  totalAmount:     { fontWeight: '800', color: ORANGE, fontSize: 17 },

  cardFooter:      { paddingHorizontal: 14, paddingBottom: 14 },
  actionBtn:       { borderRadius: 10, padding: 12, alignItems: 'center' },
  actionBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
