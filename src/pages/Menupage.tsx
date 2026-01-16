import { useEffect, useState } from "react";
import Navigation from "../components/Navigation.js";
import { API_BASE_URL } from "../config";

/* ---------- Types ---------- */

type MenuItem = {
  id: number;
  name: string;
  price: string;
  isAvailable: boolean;
  imageUrl?: string;
};

type Category = {
  id: number;
  name: string;
  items: MenuItem[];
};
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};
const PLACEHOLDER_IMAGE = "/menu-images/placeholder.png";

/* ---------- Component ---------- */

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");

    if (!table) {
      alert("Invalid QR");
      return;
    }

    // Initialize guestId if not exists
    if (!localStorage.getItem(`guestId_table_${table}`)) {
      localStorage.setItem(`guestId_table_${table}`, `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }

    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch (err) {
        console.error("Error loading cart from localStorage:", err);
      }
    }

    fetch(`${API_BASE_URL}/menu?table=${table}`)
      .then(async res => {
        if (!res.ok) {
          if (res.status === 400) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Invalid table number");
          }
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.categories)) {
          throw new Error("Invalid menu data");
        }

        setCategories(data.categories);

        if (data.categories.length > 0) {
          setActiveCategoryId(data.categories[0].id);
        }
      })
      .catch(err => {
        console.error(err);
        if (err instanceof TypeError && err.message.includes('fetch')) {
          alert("Cannot connect to server. Please make sure the backend server is running on port 3000.\n\nTo start: cd backend && npm run dev");
        } else {
          alert(err instanceof Error ? err.message : "Menu could not be loaded. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (err) {
        console.error("Error saving cart to localStorage:", err);
      }
    }
  }, [cart]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading menu...
      </div>
    );
  }
  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(ci => ci.id === item.id);

      if (existing) {
        return prev.map(ci =>
          ci.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          imageUrl: item.imageUrl
        },
      ];
    });
  }
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const activeCategory = categories.find(
    c => c.id === activeCategoryId
  );

  return (
    <>
      <div className="menu-page">
        {/* ---------- HEADER ---------- */}
        <header className="menu-header">
          <h1 className="menu-title">Menu</h1>
        </header>

        {/* ---------- CATEGORY TABS ---------- */}
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`category-tab ${activeCategoryId === category.id
                ? "category-tab-active"
                : ""
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* ---------- MENU GRID ---------- */}
        <main>
          <div className="menu-grid">
            {activeCategory?.items.map(item => (
              <div key={item.id} className="menu-card">
                {/* Menu Item Image */}
                <div className="menu-image">
                  <img
                    src={`${item.imageUrl}${item.imageUrl?.includes('?') ? '&' : '?'}t=${Date.now()}`}
                    alt={item.name}
                    className="menu-image-img"
                    loading="lazy"
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
                </div>

                <div>
                  <h3 className="menu-item-name">
                    {item.name}
                  </h3>
                  <p className="menu-item-price">
                    ₹{item.price}
                  </p>
                </div>

                <button
                  className="menu-add-btn"
                  onClick={() => addToCart(item)}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </main>

        {cart.length > 0 && (
          <footer className="menu-footer">
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {/* Cart Items Preview */}
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-white/90 rounded-lg p-2 border border-gray-100">
                    <img
                      src={`${item.imageUrl}${item.imageUrl?.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
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
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Summary and Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 sticky bottom-0 bg-white">
                <div>
                  <p className="text-sm font-medium">
                    {totalItems} item{totalItems > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    ₹{totalPrice}
                  </p>
                </div>

                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 shadow-md flex-shrink-0"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const table = params.get("table");

                    // Ensure cart is saved before navigation
                    try {
                      localStorage.setItem("cart", JSON.stringify(cart));
                      // Small delay to ensure localStorage write completes
                      setTimeout(() => {
                        window.location.href = `/cart?table=${table}`;
                      }, 50);
                    } catch (err) {
                      console.error("Error saving cart:", err);
                      alert("Error saving cart. Please try again.");
                    }
                  }}
                >
                  View Cart
                </button>
              </div>
            </div>
          </footer>
        )}

      </div>

      <Navigation />
    </>
  );
}
