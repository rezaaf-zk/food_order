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

        // Memuat pesanan aktif saat ini dari localStorage saat aplikasi pertama kali dibuka
        const activeOrderId = localStorage.getItem('activeOrderId');
        if (activeOrderId) {
          const activeOrder = parsedOrders.find(o => o.orderId === activeOrderId && o.status !== 'completed');
          if (activeOrder) {
            setCurrentOrder(activeOrder);
          } else {
            localStorage.removeItem('activeOrderId'); // Hapus jika pesanan sudah selesai atau tidak ditemukan
          }
        }
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
    // Simpan ID pesanan yang sedang aktif ke localStorage agar tidak hilang saat refresh
    localStorage.setItem('activeOrderId', orderWithUser.orderId);

    // Kirim notifikasi ke tab lain (misal: dashboard admin) bahwa ada pesanan baru
    const channel = new BroadcastChannel('order_updates');
    channel.postMessage({ type: 'NEW_ORDER', payload: orderWithUser });
    channel.close();

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

  const handleFinishViewingOrder = () => {
    // Jika pesanan sudah selesai, hapus dari status aktif saat pengguna kembali ke menu
    if (liveOrder?.status === 'completed') {
      setCurrentOrder(null);
      localStorage.removeItem('activeOrderId');
    }
    setView('menu');
  };

  // Selalu gunakan data pesanan terbaru dari `allOrders` untuk memastikan statusnya live
  const liveOrder = allOrders.find(o => o.orderId === currentOrder?.orderId) || currentOrder;

  return (
    // Latar belakang diubah untuk memberikan tampilan bingkai di desktop
    <div className="min-h-screen bg-gray-100 md:bg-gray-200">
      {/* Kontainer utama dibuat responsif, lebih lebar di desktop */}
      <div className="w-full max-w-md mx-auto bg-white md:max-w-lg md:my-4 md:rounded-xl md:shadow-lg">
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
            currentOrder={liveOrder} // Kirim pesanan saat ini ke sidebar
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
          order={liveOrder}
          onBack={handleFinishViewingOrder} // Gunakan fungsi baru untuk membersihkan status
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
      </div>

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
