import {BrowserRouter,Routes,Route} from 'react-router-dom';
import { useEffect } from 'react';
import './App.css'
import './index.css'
import './styles/menu.css'
import Menupage from './pages/Menupage';
import CartPage from './pages/CartPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AdminPage from './pages/AdminPage';
function App() {
  useEffect(() => {
    console.log('API URL from env:', import.meta.env.VITE_API_URL);
  }, []);

  return(
<BrowserRouter>
<Routes>  
  <Route path="/" element={<Menupage />}/>
  <Route path="/cart" element={<CartPage />}/>
  <Route path="/order-status" element={<OrderStatusPage />}/>
  <Route path="/admin" element={<AdminPage />}/>
</Routes>
</BrowserRouter>
  );
}
export default App
