import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

type OrderSummary = {
  id: string;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("1");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTable]);

  const fetchOrders = async () => {
    try {
      setError(null); // Clear previous errors
      const response = await fetch(`${API_BASE_URL}/orders/table/${selectedTable}`);

      if (!response.ok) {
        if (response.status === 404) {
          setOrders([]); // No orders found, not an error
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const ordersData = await response.json();
      setOrders(ordersData);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Cannot connect to server. Please make sure the backend server is running on port 3000.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update order status (${response.status})`);
      }

      // Refresh orders
      fetchOrders();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        alert("Cannot connect to server. Please make sure the backend server is running on port 3000.");
      } else {
        alert(err instanceof Error ? err.message : "Failed to update order status");
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-yellow-400 px-4 py-4 shadow-sm rounded-b-2xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-black">Cafe Admin Dashboard</h1>
          <p className="text-gray-700 text-sm mt-1">Manage orders and track status</p>
        </div>
      </header>

      {/* Table Selector */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md">
          <label className="block text-sm font-medium mb-2">Select Table:</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
          >
            <option value="1">Table 1</option>
            <option value="2">Table 2</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <main className="max-w-6xl mx-auto p-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            <p className="font-medium mb-2">{error}</p>
            {error.includes("Cannot connect to server") && (
              <div className="mt-2 text-sm">
                <p className="mb-1">To start the backend server, run:</p>
                <code className="block bg-red-100 p-2 rounded">cd backend && npm run dev</code>
              </div>
            )}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-gray-500 transition-all duration-200">
            <p>No orders found for Table {selectedTable}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-yellow-400">
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">Order #{order.id.slice(-8)}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{order.itemCount}</span> items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">₹{order.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>

                {/* Status Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className={order.status === 'pending' || order.status === 'accepted' ? 'font-semibold text-yellow-600' : order.status === 'preparing' || order.status === 'ready' || order.status === 'completed' ? 'font-semibold text-green-600' : ''}>Received</span>
                    <span className={order.status === 'preparing' ? 'font-semibold text-blue-600' : order.status === 'ready' || order.status === 'completed' ? 'font-semibold text-green-600' : ''}>Preparing</span>
                    <span className={order.status === 'ready' || order.status === 'completed' ? 'font-semibold text-green-600' : ''}>Ready</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-in-out ${order.status === 'pending' || order.status === 'accepted' ? 'w-1/3 bg-yellow-400' :
                          order.status === 'preparing' ? 'w-2/3 bg-blue-500' :
                            order.status === 'ready' || order.status === 'completed' ? 'w-full bg-green-500' :
                              'w-1/3 bg-gray-400'
                        }`}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
                    >
                      🍳 Start Preparing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
                    >
                      ✅ Mark Ready
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
                    >
                      ✓ Complete Order
                    </button>
                  )}

                  {(order.status === 'pending' || order.status === 'preparing') && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this order?')) {
                          updateOrderStatus(order.id, 'cancelled');
                        }
                      }}
                      className="px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
