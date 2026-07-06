import React, { useState, useEffect } from 'react';
import MenuList from './components/User/MenuList';
import ItemSelector from './components/User/ItemSelector';
import Cart from './components/shared/Cart';
import Checkout from './components/User/Checkout';
import PaymentMethod from './components/User/PaymentMethod';
import OrderStatusView from './components/User/OrderStatusView';
import AdminDashboard from './components/Admin/AdminDashboard';
import AuthMenu from './components/shared/AuthMenu';
import Sidebar from './components/User/Sidebar';
import { CartProvider, CartContext } from './context/CartContext';

function AppContent() {
  const [view, setView] = useState('menu');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [allOrders, setAllOrders] = useState([]);

  const { cart, getTotalPrice, clearCart } = React.useContext(CartContext);

  useEffect(() => {
    const saved = localStorage.getItem('orders');
    if (saved) {
      try {
        let parsedOrders = JSON.parse(saved);
        // Migrasi data lama: pastikan semua pesanan memiliki `createdAt` untuk sorting
        // Pesanan tanpa tanggal akan dianggap paling lama.
        parsedOrders = parsedOrders.map(order => ({
          ...order,
          createdAt: order.createdAt || new Date(0).toISOString() 
        }));
        setAllOrders(parsedOrders);
      } catch (e) {
        console.log('Error loading orders');
      }
    }
  }, []);

  // Efek untuk menangani redirect dari Stripe setelah pembayaran
  useEffect(() => {
    const handleStripeRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const clientSecret = urlParams.get('payment_intent_client_secret');
      const redirectStatus = urlParams.get('redirect_status');

      if (!clientSecret) {
        return;
      }

      const savedOrderDataString = localStorage.getItem('stripe_order');
      
      if (redirectStatus === 'succeeded' && savedOrderDataString) {
        const savedOrderData = JSON.parse(savedOrderDataString);

        const completeOrderData = {
          ...savedOrderData,
          paymentMethod: 'stripe',
          paymentBank: 'online', 
          paymentStatus: 'completed',
          status: 'processing', // Langsung diproses
          paymentIntentId: urlParams.get('payment_intent'),
        };

        // Panggil fungsi konfirmasi untuk membuat pesanan dan menampilkan status
        handleConfirmOrder(completeOrderData);

      } else if (redirectStatus !== 'succeeded') {
        alert('Pembayaran gagal. Silakan coba lagi.');
        setView('checkout');
      }

      localStorage.removeItem('stripe_order');
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    handleStripeRedirect();
  }, []); 


  const handleUpdateOrders = (updatedOrders) => {
    setAllOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  const handleSelectItem = (item, category) => {
    setSelectedItem(item);
    setSelectedCategory(category);
    setView('itemSelector');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang Anda masih kosong!');
      return;
    }
    setView('checkout');
  };

  const handleProceedToPayment = (orderData) => {
    setOrderData(orderData);
    setView('payment');
  };

  const handleConfirmOrder = (completeOrderData) => {
    const orderWithUser = {
      ...completeOrderData,
      userId: user?.userId || null,
      createdAt: new Date().toISOString(), // Tambahkan timestamp untuk sorting
    };
    setCurrentOrder(orderWithUser);

    handleUpdateOrders([...allOrders, orderWithUser]);
    clearCart();
    setView('orderStatus');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.userType === 'admin') {
      setView('adminDashboard');
    } else {
      setView('menu');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('menu');
  };


  const liveOrder = allOrders.find(o => o.orderId === currentOrder?.orderId) || currentOrder;

  return (
    <div className="min-h-screen bg-gray-200">
      {view === 'menu' && user?.userType !== 'admin' && (
        <>
          <MenuList
            onSelectItem={handleSelectItem}
            toggleSidebar={() => setIsSidebarOpen(true)}
            cartCount={cart.length}
          />
          <Cart onCheckout={handleCheckout} />
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onViewChange={(targetView) => {
              setView(targetView);
              setIsSidebarOpen(false);
            }}
            user={user}
            onLoginClick={() => setIsLoginOpen(true)}
            onLogout={handleLogout}
            allOrders={allOrders}
          />
        </>
      )}

      {view === 'itemSelector' && selectedItem && (
        <ItemSelector
          item={selectedItem}
          category={selectedCategory}
          onBack={() => setView('menu')}
        />
      )}

      {view === 'checkout' && (
        <Checkout
          onBack={() => setView('menu')}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {view === 'payment' && orderData && (
        <PaymentMethod
          orderData={orderData}
          onBack={() => setView('checkout')}
          onConfirmOrder={handleConfirmOrder}
        />
      )}

      {view === 'orderStatus' && liveOrder && (
        <OrderStatusView
          order={liveOrder} // Gunakan `liveOrder` yang selalu up-to-date
          onBack={() => setView('menu')}
        />
      )}

      {view === 'adminDashboard' && user?.userType === 'admin' && (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          orders={allOrders}
          onUpdateOrders={handleUpdateOrders}
        />
      )}

      <AuthMenu
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
