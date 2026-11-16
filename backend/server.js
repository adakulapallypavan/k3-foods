const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

app.use(cors());
app.use(express.json());

const menu = [
  {
    id: 'breakfast', name: 'Breakfast', items: [
      { id: 'bp1', name: 'Kanda Poha', variants: [{ label: 'Small', price: 30 }, { label: 'Large', price: 50 }] },
      { id: 'bp2', name: 'Upma', variants: [{ label: 'Small', price: 40 }, { label: 'Large', price: 60 }] },
      { id: 'bp3', name: 'Sabudana Khichdi', variants: [{ label: 'Small', price: 40 }, { label: 'Large', price: 60 }] },
      { id: 'bp4', name: 'Sheera', variants: [{ label: 'Small', price: 50 }, { label: 'Large', price: 80 }] },
      { id: 'bp5', name: 'Idil Sambar', variants: [{ label: 'Small', price: 30 }, { label: 'Large', price: 50 }] },
      { id: 'bp6', name: 'Set Dosa', variants: [{ label: 'Small', price: 40 }, { label: 'Large', price: 60 }] },
      { id: 'bp7', name: 'Bred Pakoda', price: 25 },
      { id: 'bp8', name: 'Sabudana Vada (2pc)', price: 70 },
      { id: 'bp9', name: 'Puri Sabji (4pc)', price: 70 },
    ]
  },
  {
    id: 'dosa', name: 'Dosa', items: [
      { id: 'd1', name: 'Plain Dosa', price: 70 },
      { id: 'd2', name: 'Plain Butter Dosa', price: 90 },
      { id: 'd3', name: 'Onion Dosa', price: 90 },
      { id: 'd4', name: 'Plain Cheese Dosa', price: 120 },
      { id: 'd5', name: 'Masala Dosa', price: 100 },
      { id: 'd6', name: 'Butter Masala Dosa', price: 120 },
      { id: 'd7', name: 'Paneer Masala Dosa', price: 140 },
      { id: 'd8', name: 'Cheese Masala Dosa', price: 180 },
      { id: 'd9', name: 'Mysore Masala Dosa', price: 150 },
      { id: 'd10', name: 'Benne Dosa', price: 120 },
      { id: 'd11', name: 'Ghee Plain Dosa', price: 120 },
      { id: 'd12', name: 'Ghee Masala Dosa', price: 150 },
    ]
  },
  {
    id: 'uttapam', name: 'Uttapam', items: [
      { id: 'u1', name: 'Plain Uttapam', price: 70 },
      { id: 'u2', name: 'Onion Uttapam', price: 90 },
      { id: 'u3', name: 'Masala Uttapam', price: 120 },
      { id: 'u4', name: 'Paneer Uttapam', price: 160 },
      { id: 'u5', name: 'Cheese Masala Uttapam', price: 160 },
      { id: 'u6', name: 'Cheese Pizza Uttapam', price: 180 },
    ]
  },
  {
    id: 'mumbai_street', name: 'Mumbai Street Food', items: [
      { id: 'ms1', name: 'Mumbai Vada Pav', price: 40 },
      { id: 'ms2', name: 'Butter Vada Pav', price: 50 },
      { id: 'ms3', name: 'Grill Vada Pav', price: 70 },
      { id: 'ms4', name: 'Cheese Vada Pav', price: 70 },
      { id: 'ms5', name: 'Masala Vada Pav', price: 50 },
      { id: 'ms6', name: 'Butter Dabeli', price: 50 },
      { id: 'ms7', name: 'Cheese Dabeli', price: 80 },
      { id: 'ms8', name: 'Mumbai Pav Bhaji', price: 100 },
      { id: 'ms9', name: 'Sp. Misal Pav', price: 100 },
      { id: 'ms10', name: 'Sp. Paneer Burji Pav', price: 200 },
      { id: 'ms11', name: 'Extra Butter', price: 30 },
      { id: 'ms12', name: 'Extra Cheese', price: 50 },
    ]
  },
  {
    id: 'thali', name: 'Thali', items: [
      { id: 'th1', name: 'Dal Rice', price: 60 },
      { id: 'th2', name: 'Sabji Roti (4 Roti, 1 Sabji)', price: 60 },
      { id: 'th3', name: 'Veg Thali (Limited)', price: 90 },
      { id: 'th4', name: 'Paneer Thali (Limited)', price: 150 },
      { id: 'th5', name: 'K3 Special Thali (Limited)', price: 160 },
      { id: 'th6', name: 'Special Thali (Without Onion Garlic)', price: 150 },
    ]
  },
  {
    id: 'roti', name: 'Roti', items: [
      { id: 'r1', name: 'Plain Tawa Roti', price: 7 },
      { id: 'r2', name: 'Butter Tawa Roti', price: 10 },
      { id: 'r3', name: 'Ghee Plain Paratha (2pc)', price: 80 },
    ]
  },
  {
    id: 'rice', name: 'Rice', items: [
      { id: 'ri1', name: 'Plain Rice', variants: [{ label: 'Small', price: 70 }, { label: 'Large', price: 120 }] },
      { id: 'ri2', name: 'Jeera Rice', variants: [{ label: 'Small', price: 80 }, { label: 'Large', price: 140 }] },
      { id: 'ri3', name: 'Lemon Rice', price: 100 },
      { id: 'ri4', name: 'Masala Rice', price: 100 },
      { id: 'ri5', name: 'Dal Khichdi', price: 120 },
      { id: 'ri6', name: 'Sambar Rice', price: 70 },
    ]
  },
  {
    id: 'main_course', name: 'Main Course', items: [
      { id: 'mc1', name: 'Shahi Paneer', variants: [{ label: 'Half', price: 120 }, { label: 'Full', price: 180 }] },
      { id: 'mc2', name: 'Matar Paneer', variants: [{ label: 'Half', price: 120 }, { label: 'Full', price: 180 }] },
      { id: 'mc3', name: 'Kadai Paneer', variants: [{ label: 'Half', price: 150 }, { label: 'Full', price: 200 }] },
      { id: 'mc4', name: 'Handi Paneer', variants: [{ label: 'Half', price: 180 }, { label: 'Full', price: 260 }] },
      { id: 'mc5', name: 'Paneer Dhaniya Adraki', variants: [{ label: 'Half', price: 160 }, { label: 'Full', price: 220 }] },
      { id: 'mc6', name: 'Paneer Bhurji', variants: [{ label: 'Half', price: 180 }, { label: 'Full', price: 280 }] },
      { id: 'mc7', name: 'Paneer 2 Pyaza', variants: [{ label: 'Half', price: 160 }, { label: 'Full', price: 220 }] },
      { id: 'mc8', name: 'Dal Fry', variants: [{ label: 'Half', price: 100 }, { label: 'Full', price: 160 }] },
      { id: 'mc9', name: 'Dal Tadka', variants: [{ label: 'Half', price: 120 }, { label: 'Full', price: 180 }] },
      { id: 'mc10', name: 'Dal Jeera', variants: [{ label: 'Half', price: 100 }, { label: 'Full', price: 160 }] },
      { id: 'mc11', name: 'Aalu Jeera', variants: [{ label: 'Half', price: 100 }, { label: 'Full', price: 160 }] },
      { id: 'mc12', name: 'Aalu Matar', variants: [{ label: 'Half', price: 90 }, { label: 'Full', price: 150 }] },
      { id: 'mc13', name: 'Veg Kolhapuri', variants: [{ label: 'Half', price: 160 }, { label: 'Full', price: 240 }] },
    ]
  },
  {
    id: 'chaat', name: 'Mumbai Chaat', items: [
      { id: 'ch1', name: 'Dahi Sev Puri', price: 100 },
      { id: 'ch2', name: 'Sevpuri', price: 80 },
      { id: 'ch3', name: 'Papadi Chaat', price: 80 },
      { id: 'ch4', name: 'Ragda Patice', price: 100 },
      { id: 'ch5', name: 'Bhelpuri Sukha', price: 60 },
      { id: 'ch6', name: 'Bhelpuri', price: 70 },
      { id: 'ch7', name: 'Dahi Vada', price: 100 },
    ]
  },
  {
    id: 'pakoda', name: 'Special Pakodas', items: [
      { id: 'pk1', name: 'Onion Pakoda', price: 100 },
      { id: 'pk2', name: 'Aalu Pakoda', price: 100 },
      { id: 'pk3', name: 'Palak Pakoda', price: 100 },
      { id: 'pk4', name: 'Mix Pakoda', price: 150 },
    ]
  },
  {
    id: 'beverages', name: 'Beverages', items: [
      { id: 'bv1', name: 'Coffee', price: 25 },
      { id: 'bv2', name: 'Cold Coffee', price: 80 },
      { id: 'bv3', name: 'Oreo Shake', price: 100 },
      { id: 'bv4', name: 'Kokum Sharbat', price: 40 },
      { id: 'bv5', name: 'Kokum Soda', price: 60 },
      { id: 'bv6', name: 'Amla Sharbat', price: 40 },
      { id: 'bv7', name: 'Aam Panna', price: 40 },
      { id: 'bv8', name: 'Nimbu Pani', price: 40 },
      { id: 'bv9', name: 'Fresh Lime Soda', price: 70 },
    ]
  },
];

let orders = [];
let billRequests = [];

app.get('/api/menu', (req, res) => {
  res.json(menu);
});

app.get('/api/orders', (req, res) => {
  res.json(orders.filter(o => o.status !== 'delivered'));
});

app.post('/api/orders', (req, res) => {
  const { tableNumber, items, note } = req.body;
  if (!tableNumber || !items || !items.length) {
    return res.status(400).json({ error: 'tableNumber and items are required' });
  }
  const order = {
    id: uuidv4(),
    tableNumber,
    items,
    note: note || '',
    status: 'received',
    createdAt: new Date().toISOString(),
    total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
  };
  orders.push(order);
  io.emit('new_order', order);
  res.status(201).json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  io.emit('order_updated', order);
  res.json(order);
});

app.post('/api/bill-request', (req, res) => {
  const { tableNumber } = req.body;
  if (!tableNumber) return res.status(400).json({ error: 'tableNumber required' });
  const request = { id: uuidv4(), tableNumber, requestedAt: new Date().toISOString() };
  billRequests.push(request);
  io.emit('bill_request', request);
  res.status(201).json(request);
});

app.delete('/api/bill-request/:id', (req, res) => {
  billRequests = billRequests.filter(r => r.id !== req.params.id);
  io.emit('bill_request_dismissed', req.params.id);
  res.json({ success: true });
});

app.delete('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = 'delivered';
  io.emit('order_updated', order);
  orders = orders.filter(o => o.id !== req.params.id);
  res.json({ success: true });
});

io.on('connection', (socket) => {
  socket.emit('orders_init', orders.filter(o => o.status !== 'delivered'));
  socket.emit('bill_requests_init', billRequests);
});

const DIST = path.join(__dirname, '../frontend/dist');
app.use(express.static(DIST));
app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`K3 Foods running on port ${PORT}`);
});
