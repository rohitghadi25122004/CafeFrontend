import { useEffect, useState } from "react";

export default function Navigation() {
  const [table, setTable] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableFromUrl = params.get("table");
    if (tableFromUrl) {
      setTable(tableFromUrl);
    }
  }, []);

  const currentPath = window.location.pathname;

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-3 px-2">
          {/* Menu Button */}
          <button
            onClick={() => {
              if (table) {
                window.location.href = `/?table=${table}`;
              } else {
                window.location.href = "/";
              }
            }}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              currentPath === "/" 
                ? "text-black scale-105" 
                : "text-gray-500 hover:text-black hover:scale-105"
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Menu</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={() => {
              if (table) {
                window.location.href = `/cart?table=${table}`;
              } else {
                window.location.href = "/cart";
              }
            }}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              currentPath === "/cart" 
                ? "text-black scale-105" 
                : "text-gray-500 hover:text-black hover:scale-105"
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium">Cart</span>
          </button>

          {/* Orders Button */}
          <button
            onClick={() => {
              if (table) {
                window.location.href = `/order-status?table=${table}`;
              } else {
                window.location.href = "/order-status";
              }
            }}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              currentPath === "/order-status" 
                ? "text-black scale-105" 
                : "text-gray-500 hover:text-black hover:scale-105"
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-medium">Orders</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
