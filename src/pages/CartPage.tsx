import { useState, useEffect } from "react";
import Navigation from "../components/Navigation.js";
import { API_BASE_URL } from "../config";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

const taxRate = 0.05;

const PLACEHOLDER_IMAGE = "/menu-images/placeholder.png";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [table, setTable] = useState<string>("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search);
    const tableFromUrl = param.get("table");
    if (!tableFromUrl) {
      alert("Invalid Session");
      return;
    }
    setTable(tableFromUrl);

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      } catch (err) {
        console.error("Error loading cart from localStorage:", err);
        // Clear invalid cart data
        localStorage.removeItem('cart');
      }
    }
  },
    []
  );
  //save cart for loacal storage
  useEffect(() => {
    if (cart.length > 0) {
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (err) {
        console.error("Error saving cart to localStorage:", err);
      }
    } else {
      // Clear cart from localStorage if empty
      localStorage.removeItem("cart");
    }
  }, [cart]);

  const incQty = (id: number) => {
    setCart(prev =>
      prev.map(item => item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
      )
    );
  };
  const decQty = (id: number) => {
    setCart(prev =>
      prev.map(item => item.id === id
        ? { ...item, quantity: item.quantity - 1 }
        : item
      )
        .filter(item => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  const placeOrder = async () => {
    if (cart.length === 0) {
      return;
    }

    setIsPlacingOrder(true);
    let guestToken = localStorage.getItem(`guestId_table_${table}`);
    if (!guestToken) {
      guestToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`guestId_table_${table}`, guestToken);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table,
          guestToken,
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(error.message || 'Failed to place order');
      }

      const orderData = await response.json();

      // Validate orderId exists
      if (!orderData.orderId) {
        throw new Error('Order Does Not Exist');
      }

      if (!table) {
        throw new Error('Table number is missing');
      }

      // Store orderId in localStorage for future reference
      localStorage.setItem(`lastOrderId_table_${table}`, orderData.orderId);

      // Clear cart
      localStorage.removeItem('cart');

      // Build redirect URL
      const redirectUrl = `/order-status?orderId=${encodeURIComponent(orderData.orderId)}&table=${encodeURIComponent(table)}`;

      // Small delay to ensure localStorage is written
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);

    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Cannot connect to server. Please make sure the backend server is running on port 3000.\n\nTo start: cd backend && npm run dev');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
          <header className="bg-yellow-400 px-4 py-4 shadow-sm rounded-b-2xl">
            <h1 className="text-lg font-semibold text-black text-center">Your Cart</h1>
          </header>
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-4">Your cart is empty.</p>
              <button
                className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-medium transition-all duration-200 active:scale-95"
                onClick={() => (window.location.href = `/?table=${table}`)}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
        <Navigation />
      </>
    );
  };
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-yellow-400 px-4 py-4 shadow-sm rounded-b-2xl">
          <h1 className="text-lg font-semibold text-black text-center">Your Cart</h1>
        </header>

        {/* Cart Items - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {cart.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {/* Item Image */}
              <img
                src={`${item.imageUrl}${item.imageUrl?.includes('?') ? '&' : '?'}t=${Date.now()}`}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const localPath = `/menu-images/${item.id}.jpg`;
                  if (target.src.includes(item.imageUrl || '___')) {
                    target.src = localPath;
                  } else if (target.src.includes(localPath)) {
                    target.src = PLACEHOLDER_IMAGE;
                  }
                }}
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm break-words leading-snug max-w-[140px]">{item.name}</p>
                <p className="text-sm text-gray-500">
                  ₹{item.price} × {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => decQty(item.id)}
                  className="w-9 h-9 rounded-full border-2 border-gray-300 text-lg font-medium hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center"
                >
                  −
                </button>
                <span className="font-semibold min-w-[24px] text-center">{item.quantity}</span>
                <button
                  onClick={() => incQty(item.id)}
                  className="w-9 h-9 rounded-full border-2 border-gray-300 text-lg font-medium hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </main>

        {/* Price Summary - Fixed at bottom above navigation */}
        <footer className="fixed bottom-20 left-0 right-0 max-w-md mx-auto bg-white border-t shadow-lg p-4 space-y-2 z-40 rounded-t-2xl border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (5%)</span>
            <span>₹{tax}</span>
          </div>

          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={isPlacingOrder}
            className="w-full mt-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          >
            {isPlacingOrder ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </footer>
      </div>

      <Navigation />
    </>
  );
};