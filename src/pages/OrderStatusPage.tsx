import { useState, useEffect } from "react";
import Navigation from "../components/Navigation.js";
import { API_BASE_URL } from "../config";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  id: string;
  tableNumber: number;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  total: number;
  items: OrderItem[];
};

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
  pending: "Order Received",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

// UPI Configuration - REPLACE WITH MERCHANT DETAILS
const MERCHANT_VPA = "9405764935@naviaxis"; // TODO: REPLACE WITH YOUR VALID UPI ID (e.g., yourname@oksbi)
const MERCHANT_NAME = "Cafe Merchant";

export default function OrderStatusPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersForTable, setOrdersForTable] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [table, setTable] = useState<string | null>(null);

  const handleOrderClick = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedOrder(detail);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getUpiLink = (platform: 'gpay' | 'paytm' | 'phonepe' | 'default', amount: number, orderId: string, items: OrderItem[]) => {
    // specific formatting: "Item1(2), Item2(1)"
    const itemSummary = items.map(item => `${item.name}(${item.quantity})`).join(', ');
    const note = `${itemSummary} | Order #${orderId.slice(-8)}`;

    // UPI notes have length limits, so we truncate if necessary (safe limit ~80 chars)
    const truncatedNote = note.length > 80 ? note.substring(0, 77) + "..." : note;

    const params = new URLSearchParams({
      pa: MERCHANT_VPA,
      pn: MERCHANT_NAME,
      am: amount.toFixed(2),
      // tr: orderId, // Transaction Reference - DISABLED: Causes failure with Personal/Navi IDs
      tn: truncatedNote, // Transaction Note with items
      cu: "INR",
    });

    const baseUrl = params.toString();

    switch (platform) {
      case 'gpay':
        return `tez://upi/pay?${baseUrl}`;
      case 'paytm':
        return `paytmmp://pay?${baseUrl}`;
      case 'phonepe':
        return `phonepe://pay?${baseUrl}`;
      default:
        return `upi://pay?${baseUrl}`;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let orderId = params.get("orderId");
    const tableParam = params.get("table");

    console.log('OrderStatusPage - URL params:', { orderId, table: tableParam });
    console.log('OrderStatusPage - Full URL:', window.location.href);

    setTable(tableParam);

    if (!orderId && tableParam) {
      const lastOrderId = localStorage.getItem(`lastOrderId_table_${tableParam}`);
      if (lastOrderId) {
        orderId = lastOrderId;
        // Update URL without reload
        const newUrl = `/order-status?orderId=${encodeURIComponent(orderId)}&table=${encodeURIComponent(tableParam)}`;
        window.history.replaceState({}, '', newUrl);
      }
    }

    if (!tableParam) {
      setError(`Missing Table Number`);
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setError(null);

        // Load orders for the table (filtered by guestToken)
        const guestToken = localStorage.getItem(`guestId_table_${tableParam}`);
        const tableUrl = `${API_BASE_URL}/orders/table/${tableParam}${guestToken ? `?guestToken=${guestToken}` : ''}`;
        const tableResponse = await fetch(tableUrl);
        if (tableResponse.ok) {
          const orders = await tableResponse.json();
          setOrdersForTable(orders || []);

          // If no specific orderId requested, select the most recent order
          if (!orderId && orders && orders.length > 0) {
            const mostRecentOrder = orders[0];
            orderId = mostRecentOrder.id;
            console.log('Using most recent order ID:', orderId);
            if (orderId && tableParam) {
              localStorage.setItem(`lastOrderId_table_${tableParam}`, orderId);
              const newUrl = `/order-status?orderId=${encodeURIComponent(orderId)}&table=${encodeURIComponent(tableParam)}`;
              window.history.replaceState({}, '', newUrl);
            }
          }
        }

        if (!orderId) {
          // No order to load, just show the orders list
          setLoading(false);
          return;
        }

        // Load the specific order details
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Order not found");
          }
          throw new Error(`Server error: ${response.status}`);
        }

        const orderData = await response.json();
        setSelectedOrder(orderData);

        // Store orderId in localStorage for future reference
        if (tableParam) {
          localStorage.setItem(`lastOrderId_table_${tableParam}`, orderId);
        }

      } catch (err) {
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError("Cannot connect to server. Please make sure the backend server is running on port 3000.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load order");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
          <header className="bg-yellow-400 px-4 py-4 shadow-sm rounded-b-2xl">
            <h1 className="text-lg font-semibold text-black text-center">Order Status</h1>
          </header>
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center max-w-md mx-auto p-4">
              <p className="text-red-500 mb-4 font-medium">{error}</p>
              <div className="space-y-2">
                <button
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-medium transition-all duration-200 active:scale-95"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
        {/* Header */}
        <header className="bg-yellow-400 px-4 py-4 shadow-sm rounded-b-2xl">
          <h1 className="font-semibold text-lg text-black text-center">Order Status</h1>
          {table && <p className="text-sm text-gray-700 text-center mt-1">Table {table}</p>}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 space-y-4">
          {/* Orders List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">
              {ordersForTable.length === 0 ? "No Orders Yet" : `Orders for Table ${table}`}
            </h3>

            {ordersForTable.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                <p className="text-gray-500 mb-4">No orders found for this table yet.</p>
                <button
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-medium transition-all duration-200 active:scale-95"
                  onClick={() => window.location.href = `/?table=${table}`}
                >
                  Place an Order
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {ordersForTable.map((order) => (
                  <button
                    key={order.id}
                    className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md border ${selectedOrder?.id === order.id ? "border-yellow-400 ring-2 ring-yellow-200" : "border-transparent"
                      }`}
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Order #{order.id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status as keyof typeof statusColors]}`}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </span>
                        <p className="text-sm font-semibold mt-1">₹{order.total}</p>
                      </div>
                    </div>

                    {/* Status Progress Indicator */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex-1 text-center">
                        <div className={`w-2 h-2 rounded-full mx-auto ${order.status === "pending" || order.status === "accepted" ? "bg-yellow-400" : "bg-gray-300"}`}></div>
                        <p className="text-[10px] text-gray-600 mt-1">Received</p>
                      </div>
                      <div className="flex-1">
                        <div className={`h-1 bg-gray-200 rounded-full overflow-hidden ${order.status !== "pending" && order.status !== "accepted" ? "bg-blue-500" : ""}`}></div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className={`w-2 h-2 rounded-full mx-auto ${order.status === "preparing" ? "bg-blue-500" : order.status === "ready" || order.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <p className="text-[10px] text-gray-600 mt-1">Preparing</p>
                      </div>
                      <div className="flex-1">
                        <div className={`h-1 bg-gray-200 rounded-full overflow-hidden ${order.status === "ready" || order.status === "completed" ? "bg-green-500" : ""}`}></div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className={`w-2 h-2 rounded-full mx-auto ${order.status === "ready" || order.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <p className="text-[10px] text-gray-600 mt-1">Ready</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="bg-yellow-400 px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-black">Order Details</h2>
                <p className="text-xs text-gray-700">#{selectedOrder.id.slice(-8)}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-black hover:bg-black hover:bg-opacity-10 rounded-full p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Order Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Table {selectedOrder.tableNumber}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[selectedOrder.status as keyof typeof statusColors]}`}>
                  {statusLabels[selectedOrder.status as keyof typeof statusLabels]}
                </span>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 p-3 rounded-xl">
                <h3 className="font-semibold mb-2 text-gray-800">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="break-words max-w-[70%]">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (5%)</span>
                  <span>₹{selectedOrder.tax}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                  <span>Total</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-3 pt-2">
                <p className="font-semibold text-gray-800 text-sm">Pay with UPI</p>

                <div className="grid grid-cols-1 gap-3">
                  {/* Google Pay */}
                  <a
                    href={getUpiLink('gpay', selectedOrder.total, selectedOrder.id, selectedOrder.items)}
                    className="relative flex items-center justify-center w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <img src="/gpay.png" alt="Google Pay" className="h-8 w-auto object-contain" />
                      <span className="font-medium text-lg text-gray-700">Google Pay</span>
                    </div>
                  </a>

                  {/* PhonePe */}
                  <a
                    href={getUpiLink('phonepe', selectedOrder.total, selectedOrder.id, selectedOrder.items)}
                    className="relative flex items-center justify-center w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <img src="/phonepay.png" alt="PhonePe" className="h-8 w-auto object-contain" />
                      <span className="font-medium text-lg text-gray-700">PhonePe</span>
                    </div>
                  </a>

                  {/* Paytm */}
                  <a
                    href={getUpiLink('paytm', selectedOrder.total, selectedOrder.id, selectedOrder.items)}
                    className="relative flex items-center justify-center w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <img src="/paytm.png" alt="Paytm" className="h-6 w-auto object-contain" />
                      <span className="font-medium text-lg text-gray-700">Paytm</span>
                    </div>
                  </a>

                  {/* Other Apps */}
                  <a
                    href={getUpiLink('default', selectedOrder.total, selectedOrder.id, selectedOrder.items)}
                    className="relative flex items-center justify-center w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 active:scale-95"
                  >
                    <div className="flex items-center space-x-3">
                      <img src="/otherupi.png" alt="UPI" className="h-8 object-contain" />
                      <span>More Options</span>
                    </div>
                  </a>
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-2">
                  Payments are processed securely by your bank
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </>
  );
}
