import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../config";
import LoadingScreen from "../components/LoadingScreen";
import { formatOrderTime, getOptimizedImageUrl } from "../utils";
import { OrderItemSkeleton } from "../components/Skeleton";

type OrderSummary = {
  id: string;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
};

type Table = {
  id: number;
  tableNumber: number;
  name: string;
};

type MenuItem = {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
};

const PLACEHOLDER_IMAGE = "/menu-images/placeholder.png";

type Category = {
  id: number;
  name: string;
  items: MenuItem[];
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-500 text-white shadow-sm",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "Pending",
  paid: "PAID",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("adminAuth") === "true");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("1");

  // Menu State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItem, setNewItem] = useState({
    categoryId: "",
    name: "",
    price: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTables();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'orders') {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    } else {
      fetchCategories();
    }
  }, [selectedTable, activeTab, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "2512") { // Updated PIN
      setIsAuthenticated(true);
      localStorage.setItem("adminAuth", "true");
      setLoginError("");
    } else {
      setLoginError("Invalid PIN");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6 text-center animate-fade-in">
          <div className="bg-yellow-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 italic">Cafe <span className="text-yellow-500">Admin</span></h1>
          <p className="text-gray-500 text-sm">Please enter your 4-digit security PIN to access the dashboard.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[1em] py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-yellow-400 transition-all font-mono"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-4 rounded-2xl font-bold shadow-lg shadow-yellow-200 transition-all active:scale-95"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/orders/table/${selectedTable}`);
      if (!response.ok) {
        if (response.status === 404) {
          setOrders([]);
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const ordersData = await response.json();
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading && orders.length === 0 && activeTab === 'orders') {
    return <LoadingScreen />;
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu?table=1`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const endSession = async () => {
    if (!confirm(`Are you sure you want to end session for Table ${selectedTable}? This will clear all orders and active guests.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tables/${selectedTable}/end-session`, {
        method: 'POST'
      });
      if (response.ok) {
        alert("Session ended successfully");
        fetchOrders();
      } else {
        alert("Failed to end session");
      }
    } catch (err) {
      alert("Error ending session");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (response.ok) {
        setNewCategoryName("");
        fetchCategories();
        alert("Category added");
      }
    } catch (err) {
      alert("Failed to add category");
    }
  };

  const addMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/admin/menu-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: Number(newItem.categoryId),
          name: newItem.name,
          price: Number(newItem.price)
        }),
      });

      if (response.ok) {
        const item = await response.json();
        if (selectedFile) {
          const formData = new FormData();
          formData.append('image', selectedFile);
          await fetch(`${API_BASE_URL}/admin/menu-items/${item.id}/image`, {
            method: 'POST',
            body: formData
          });
        }
        setNewItem({ categoryId: "", name: "", price: "" });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        alert("Menu item added successfully");
      }
    } catch (err) {
      alert("Failed to add menu item");
    }
  };

  const toggleAvailability = async (id: number, isAvailable: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/menu-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      if (response.ok) {
        fetchCategories();
      }
    } catch (err) {
      alert("Failed to update availability");
    }
  };

  const handleEditImage = (itemId: number) => {
    setUploadingItemId(itemId);
    editFileInputRef.current?.click();
  };

  const onEditFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingItemId) return;

    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/menu-items/${uploadingItemId}/image`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        alert("Image updated successfully");
        fetchCategories();
      }
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploadingItemId(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/menu-items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          price: Number(editingItem.price)
        }),
      });
      if (response.ok) {
        setEditingItem(null);
        fetchCategories();
        alert("Item updated successfully");
      }
    } catch (err) {
      alert("Failed to update item");
    }
  };

  const deleteMenuItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/menu-items/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("Item deleted successfully");
        fetchCategories();
      } else {
        alert("Failed to delete item");
      }
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? All items in this category might be affected. This action cannot be undone.")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("Category deleted successfully");
        fetchCategories();
      } else {
        alert("Failed to delete category. Make sure it has no items first or check server logs.");
      }
    } catch (err) {
      alert("Error deleting category");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-yellow-400 px-4 py-4 shadow-sm rounded-b-2xl">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-black">Cafe Admin dashboard</h1>
              <p className="text-gray-700 text-sm mt-1">Manage ordering and menus</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-black/10 hover:bg-black/20 text-black p-2 rounded-xl transition-colors md:px-4 md:py-2 md:text-sm font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
          <div className="flex bg-yellow-500/30 p-1 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white text-black shadow-sm' : 'text-gray-700'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'menu' ? 'bg-white text-black shadow-sm' : 'text-gray-700'}`}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'orders' ? (
        <>
          <div className="max-w-6xl mx-auto p-4 flex flex-wrap gap-4 items-end">
            <div className="bg-white p-4 rounded-2xl shadow-sm flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Select Table:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
              >
                {tables.map(t => (
                  <option key={t.id} value={t.tableNumber}>Table {t.tableNumber}</option>
                ))}
              </select>
            </div>
            <button
              onClick={endSession}
              className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-md hover:bg-red-600 active:scale-95 transition-all"
            >
              End Session / Clear Table
            </button>
          </div>

          <main className="max-w-6xl mx-auto p-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <OrderItemSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl">{error}</div>
            ) : orders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-gray-500">No active orders found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-yellow-400 transition-all">
                    <div className="flex justify-between border-b pb-4 mb-4">
                      <div>
                        <h3 className="font-bold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-xs text-gray-500">{formatOrderTime(order.createdAt)}</p>
                      </div>
                      <span className={`px-3 py-1 h-fit rounded-full text-xs font-semibold ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xl font-bold">₹{order.total}</p>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{order.items.length} unique items</p>
                    </div>

                    {/* Items List */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-6 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700"><span className="font-bold text-black">{item.quantity}x</span> {item.name}</span>
                          <span className="text-gray-500">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold">Start Preparing</button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold">Mark Ready</button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-semibold">Complete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">Add Category</h2>
            <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name (e.g. Beverages)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-400"
                required
              />
              <button type="submit" className="bg-yellow-400 px-8 py-3 rounded-xl font-bold shadow-lg shadow-yellow-100 hover:bg-yellow-500 transition-colors">Add Category</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">Add Menu Item</h2>
            <form onSubmit={addMenuItem} className="space-y-4">
              <select
                value={newItem.categoryId}
                onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-400"
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Item Name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-400"
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="Price (₹)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-400"
                  required
                />
              </div>
              <div className="border-2 border-dashed border-gray-200 p-6 rounded-xl text-center hover:border-yellow-400 transition-colors bg-gray-50">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-gray-500 flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{selectedFile ? `Selected: ${selectedFile.name}` : "Click to select item image"}</span>
                </label>
              </div>
              <button type="submit" className="w-full bg-yellow-400 py-4 rounded-xl font-bold shadow-lg shadow-yellow-100 hover:bg-yellow-500 transition-all active:scale-[0.98]">Add New Menu Item</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-6">Current Menu</h2>
            <div className="space-y-8">
              {categories.map(cat => (
                <div key={cat.id}>
                  <div className="flex justify-between items-center mb-4 border-l-4 border-yellow-400 pl-3">
                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">{cat.name}</h3>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                      title="Delete Category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.items?.map(item => (
                      <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        {editingItem?.id === item.id ? (
                          <form onSubmit={handleUpdateItem} className="space-y-3">
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                              placeholder="Item Name"
                              required
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={editingItem.price}
                                onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                                placeholder="Price"
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" className="flex-1 bg-yellow-400 text-black text-[10px] font-bold py-1.5 rounded-lg">Save</button>
                              <button type="button" onClick={() => setEditingItem(null)} className="flex-1 bg-gray-200 text-gray-700 text-[10px] font-bold py-1.5 rounded-lg">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={getOptimizedImageUrl(item.imageUrl, item.id)}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
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
                                <p className="font-semibold text-sm truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">₹{item.price}</p>
                              </div>
                              <button
                                onClick={() => toggleAvailability(item.id, !item.isAvailable)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${item.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                              >
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-blue-600 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleEditImage(item.id)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                📷 Photo
                              </button>
                              <button
                                onClick={() => deleteMenuItem(item.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg transition-colors"
                                title="Delete Item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <input
              type="file"
              ref={editFileInputRef}
              onChange={onEditFileSelected}
              accept="image/*"
              className="hidden"
            />
          </div>
        </main>
      )}
    </div>
  );
}
