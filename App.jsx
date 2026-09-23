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
import BranchSelectorModal from './components/Branch/BranchSelectorModal';
import { CartProvider, CartContext } from './context/CartContext';
import { BranchProvider } from './context/BranchContext';
import { fetchOrders } from './services/orderService';

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

  const { cart, clearCart } = React.useContext(CartContext);

  // Load orders on initialization and periodic 5s polling for cross-device sync
  useEffect(() => {
    async function loadOrders() {
      try {
        const orders = await fetchOrders();
        setAllOrders(orders);

        const activeOrderId = localStorage.getItem('activeOrderId');
        if (activeOrderId) {
          const activeOrder = orders.find(
            (o) =>
              (o.orderId === activeOrderId || o.orderNumber === activeOrderId) &&
              o.status !== 'completed'
          );
          if (activeOrder) {
            setCurrentOrder(activeOrder);
          } else {
            localStorage.removeItem('activeOrderId');
          }
        }
      } catch (e) {
        console.warn('Error initial loading orders:', e);
      }
    }

    loadOrders();

    // Auto-poll orders every 5 seconds to sync across different devices/laptops
    const intervalId = setInterval(loadOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle Midtrans redirect / return URL parameters (if 3DS or external redirect occurs)
  useEffect(() => {
    const handlePaymentRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order_id');
      const transactionStatus = urlParams.get('transaction_status') || urlParams.get('status_code');

      if (!orderId) return;

      if (transactionStatus === 'settlement' || transactionStatus === 'capture' || transactionStatus === '200') {
        const savedOrderDataString = localStorage.getItem('pending_order_data');
        if (savedOrderDataString) {
          try {
            const savedOrderData = JSON.parse(savedOrderDataString);
            const completeOrderData = {
              ...savedOrderData,
              paymentMethod: 'midtrans',
              paymentStatus: 'paid',
              status: 'confirmed'
            };
            handleConfirmOrder(completeOrderData);
            localStorage.removeItem('pending_order_data');
          } catch (e) {}
        }
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    };

    handlePaymentRedirect();
  }, []);

  const handleUpdateOrders = (updatedOrders) => {
    setAllOrders(updatedOrders);
    try {
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (e) {}
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

  const handleProceedToPayment = (data) => {
    setOrderData(data);
    setView('payment');
  };

  const handleConfirmOrder = (completeOrderData) => {
    const orderWithUser = {
      ...completeOrderData,
      userId: user?.userId || null,
      createdAt: completeOrderData.createdAt || new Date().toISOString()
    };
    setCurrentOrder(orderWithUser);
    localStorage.setItem('activeOrderId', orderWithUser.orderId || orderWithUser.orderNumber);

    try {
      const channel = new BroadcastChannel('order_updates');
      channel.postMessage({ type: 'NEW_ORDER', payload: orderWithUser });
      channel.close();
    } catch (e) {}

    handleUpdateOrders([orderWithUser, ...allOrders]);
    clearCart();
    setView('orderStatus');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.userType === 'admin' || userData.userType === 'super_admin' || userData.userType === 'branch_manager') {
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
    if (liveOrder?.status === 'completed') {
      setCurrentOrder(null);
      localStorage.removeItem('activeOrderId');
    }
    setView('menu');
  };

  const liveOrder =
    allOrders.find(
      (o) =>
        o.orderId === currentOrder?.orderId ||
        o.orderNumber === currentOrder?.orderNumber ||
        o.orderId === currentOrder?.orderNumber
    ) || currentOrder;

  return (
    <div className="min-h-screen bg-slate-100 md:bg-slate-200 flex flex-col justify-start">
      {/* Container wrapper: full width for Admin, mobile-first card for Customer */}
      {view === 'adminDashboard' && user?.userType === 'admin' ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          orders={allOrders}
          onUpdateOrders={handleUpdateOrders}
        />
      ) : (
        <div className="relative w-full max-w-md mx-auto bg-gray-50 md:max-w-lg md:my-4 md:rounded-2xl md:shadow-xl flex flex-col md:min-h-[calc(100vh-2rem)] overflow-hidden border border-slate-200/60">
          {view === 'menu' && (
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
                currentOrder={liveOrder}
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
              onBack={handleFinishViewingOrder}
            />
          )}
        </div>
      )}

      {/* Global Branch Selector Modal */}
      <BranchSelectorModal />

      {/* Auth Modal */}
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
    <BranchProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </BranchProvider>
  );
}
