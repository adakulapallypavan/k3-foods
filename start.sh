#!/bin/bash
# Start K3 Foods restaurant system
echo "Starting K3 Foods Bombay Express..."

# Start backend
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) on http://localhost:3001"

# Start frontend
cd "../frontend"
npx vite &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID) on http://localhost:5173"

echo ""
echo "Open in browser:"
echo "  Customer Menu:    http://localhost:5173/menu?table=1"
echo "  Kitchen Dashboard: http://localhost:5173/kitchen"
echo "  QR Code Generator: http://localhost:5173/qr"
echo ""
echo "Press Ctrl+C to stop all servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
