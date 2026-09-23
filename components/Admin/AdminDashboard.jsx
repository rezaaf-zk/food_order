import React, { useState, useEffect, useMemo } from 'react';
import {
  LogOut,
  Trash2,
  DollarSign,
  ShoppingCart,
  Clock,
  Utensils,
  CheckCircle,
  Package,
  Layers,
  BarChart3,
  FileText,
  AlertTriangle,
  Store,
  Calendar,
  Download,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import {
  fetchBranchInventory,
  fetchLowStockAlerts,
  adjustStock,
  fetchRecipes
} from '../../services/inventoryService';
import {
  fetchAnalyticsData,
  exportSalesReportToCSV
} from '../../services/analyticsService';
import { updateOrderStatus, deleteOrder } from '../../services/orderService';

const statusConfig = {
  waiting: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', next: 'processing' },
  processing: { text: 'Diproses', color: 'bg-blue-100 text-blue-800', next: 'ready' },
  ready: { text: 'Siap Diambil', color: 'bg-emerald-100 text-emerald-800', next: 'completed' },
  completed: { text: 'Selesai', color: 'bg-gray-100 text-gray-600', next: null }
};

const getNextStatusText = (status) => {
  if (status === 'waiting') return 'Proses Pesanan';
  if (status === 'processing') return 'Siap Diambil';
  if (status === 'ready') return 'Selesaikan';
  return null;
};

export default function AdminDashboard({ user, onLogout, orders, onUpdateOrders }) {
  const { branches } = useBranch();

  // Navigation tabs: 'orders' | 'inventory' | 'recipes' | 'analytics' | 'reports'
  const [activeTab, setActiveTab] = useState('orders');

  // Filters
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');

  // Data states
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Stock Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('purchase');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const activeBranchId = selectedBranchFilter === 'all' ? null : selectedBranchFilter;

  // Load Inventory and Analytics data
  const loadModuleData = async () => {
    setIsLoadingData(true);
    try {
      const [invData, recData, analData] = await Promise.all([
        fetchBranchInventory(activeBranchId),
        fetchRecipes(),
        fetchAnalyticsData(activeBranchId, selectedPeriod)
      ]);
      setInventory(invData);
      setRecipes(recData);
      setAnalytics(analData);
    } catch (e) {
      console.warn('Error loading admin module data:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadModuleData();
  }, [activeBranchId, selectedPeriod]);

  // Filter orders by branch
  const filteredOrders = useMemo(() => {
    if (selectedBranchFilter === 'all') return orders;
    return orders.filter((o) => o.branchId === selectedBranchFilter);
  }, [orders, selectedBranchFilter]);

  // Order stats
  const orderStats = useMemo(() => {
    const totalRevenue = filteredOrders
      .filter((o) => o.paymentStatus === 'completed' || o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      waiting: statusCounts.waiting || 0,
      processing: statusCounts.processing || 0,
      ready: statusCounts.ready || 0,
      completed: statusCounts.completed || 0
    };
  }, [filteredOrders]);

  // Sorted orders: active first, then newest
  const sortedOrders = useMemo(() => {
    const active = filteredOrders
      .filter((o) => o.status !== 'completed')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const completed = filteredOrders
      .filter((o) => o.status === 'completed')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return [...active, ...completed];
  }, [filteredOrders]);

  // Filter inventory items
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchStatus =
        inventoryStatusFilter === 'all' || item.status === inventoryStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [inventory, inventorySearch, inventoryStatusFilter]);

  // Low stock count
  const criticalStockCount = useMemo(() => {
    return inventory.filter((item) => item.status === 'warning' || item.status === 'critical' || item.status === 'out_of_stock').length;
  }, [inventory]);

  // Handlers for Orders
  const handleStatusChange = async (orderId) => {
    const targetOrder = orders.find((o) => o.orderId === orderId || o.orderNumber === orderId);
    if (!targetOrder) return;

    const nextStatus = statusConfig[targetOrder.status]?.next;
    if (!nextStatus) return;

    const updated = orders.map((o) =>
      o.orderId === orderId || o.orderNumber === orderId ? { ...o, status: nextStatus } : o
    );
    onUpdateOrders(updated);
    await updateOrderStatus(orderId, nextStatus);
  };

  const handlePaymentConfirm = async (orderId) => {
    const updated = orders.map((o) => {
      if (o.orderId === orderId || o.orderNumber === orderId) {
        const newStatus = o.status === 'waiting' ? 'processing' : o.status;
        return { ...o, paymentStatus: 'completed', status: newStatus };
      }
      return o;
    });
    onUpdateOrders(updated);
    await updateOrderStatus(orderId, 'processing', 'paid');
  };

  const handleDeleteOrder = async (orderIdToDelete) => {
    if (window.confirm('Hapus pesanan ini dari antrean?')) {
      const updated = orders.filter(
        (o) => o.orderId !== orderIdToDelete && o.orderNumber !== orderIdToDelete
      );
      onUpdateOrders(updated);
      await deleteOrder(orderIdToDelete);
    }
  };

  // Stock Adjustment Action
  const handleOpenAdjustModal = (item) => {
    setSelectedIngredient(item);
    setAdjustQty('');
    setAdjustType('purchase');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !adjustQty || isNaN(adjustQty) || Number(adjustQty) === 0) {
      alert('Masukkan jumlah penyesuaian yang valid!');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const qtyNum = adjustType === 'adjustment_out' || adjustType === 'spoilage' ? -Math.abs(Number(adjustQty)) : Math.abs(Number(adjustQty));

      await adjustStock({
        branchId: selectedIngredient.branchId || activeBranchId || branches[0]?.id,
        ingredientId: selectedIngredient.ingredientId || selectedIngredient.id,
        quantity: qtyNum,
        type: adjustType,
        notes: adjustNotes || `Penyesuaian stok ${adjustType}`,
        createdBy: user?.userId || null
      });

      setIsAdjustModalOpen(false);
      loadModuleData();
    } catch (err) {
      alert('Gagal menyesuaikan stok: ' + err.message);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const activeBranchName =
    selectedBranchFilter === 'all'
      ? 'Semua Cabang'
      : branches.find((b) => b.id === selectedBranchFilter)?.name || 'Cabang Terpilih';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              H
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Admin Business Console
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Masuk sebagai <strong className="text-fuchsia-700">{user?.username || 'Admin'}</strong> ({user?.userType || 'Manager'})
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="md:hidden flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Global Branch Filter & Logout */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Store className="w-4 h-4 text-fuchsia-600 flex-shrink-0" />
            <span className="font-semibold text-slate-500">Cabang:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Cabang (Pusat)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadModuleData}
            title="Refresh data"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="hidden md:flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold text-xs py-2 px-3.5 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      {/* Module Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'orders', label: 'Antrean Pesanan', icon: ShoppingCart, badge: orderStats.waiting > 0 ? orderStats.waiting : null },
            { id: 'inventory', label: 'Manajemen Stok', icon: Package, badge: criticalStockCount > 0 ? criticalStockCount : null },
            { id: 'recipes', label: 'Resep / BOM', icon: Layers },
            { id: 'analytics', label: 'Monitoring Penjualan', icon: BarChart3 },
            { id: 'reports', label: 'Laporan Penjualan', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-3 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-fuchsia-600 text-fuchsia-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <main className="p-4 md:p-8 flex-1 space-y-6">
        {/* =========================================================================
            TAB 1: ORDERS (Antrean Pesanan)
           ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <StatCard
                icon={<DollarSign />}
                title="Total Omzet Terfilter"
                value={`Rp ${orderStats.totalRevenue.toLocaleString('id-ID')}`}
                color="text-emerald-600 bg-emerald-50"
              />
              <StatCard
                icon={<ShoppingCart />}
                title="Total Pesanan"
                value={orderStats.totalOrders}
                color="text-blue-600 bg-blue-50"
              />
              <StatCard
                icon={<Clock />}
                title="Menunggu"
                value={orderStats.waiting}
                color="text-amber-600 bg-amber-50"
              />
              <StatCard
                icon={<Utensils />}
                title="Diproses"
                value={orderStats.processing}
                color="text-indigo-600 bg-indigo-50"
              />
              <StatCard
                icon={<CheckCircle />}
                title="Siap Diambil"
                value={orderStats.ready}
                color="text-teal-600 bg-teal-50"
              />
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-extrabold text-sm text-slate-800">
                  Daftar Pesanan ({sortedOrders.length}) — {activeBranchName}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  Auto-sync aktif
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">ID Pesanan</th>
                      <th className="px-4 py-3">Cabang</th>
                      <th className="px-4 py-3">Pemesan</th>
                      <th className="px-4 py-3">Menu</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Metode & Bayar</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedOrders.map((order) => {
                      const idText = (order.orderNumber || order.orderId || '').split('-')[1] || order.orderId || '';
                      return (
                        <tr key={order.orderId || order.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            #{idText}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">
                            {order.branchName || 'Cabang Tunjungan'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{order.customerName}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(order.createdAt || 0).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-700">
                              {(order.items || []).map((i) => `${i.name} (${i.quantity}x)`).join(', ') || 'Menu'}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-extrabold text-fuchsia-700">
                            Rp {Number(order.totalPrice || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold uppercase text-[10px] text-slate-700">
                              {order.paymentMethod}
                            </span>
                            <span
                              className={`ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                                ? 'Lunas'
                                : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full ${
                                statusConfig[order.status]?.color || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {statusConfig[order.status]?.text || order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {order.paymentStatus !== 'completed' && order.paymentStatus !== 'paid' && (
                                <button
                                  onClick={() => handlePaymentConfirm(order.orderId)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[11px] transition shadow-xs whitespace-nowrap active:scale-95"
                                >
                                  Konfirmasi Bayar
                                </button>
                              )}
                              {order.status !== 'completed' && (
                                <button
                                  onClick={() => handleStatusChange(order.orderId)}
                                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-1 px-2.5 rounded-lg text-[11px] transition shadow-xs whitespace-nowrap active:scale-95"
                                >
                                  {getNextStatusText(order.status)}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteOrder(order.orderId)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Hapus pesanan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {sortedOrders.length === 0 && (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    Belum ada pesanan yang masuk pada cabang ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: INVENTORY & STOCK (Manajemen Stok Bahan Baku)
           ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <StatCard
                icon={<Package />}
                title="Total Bahan Baku"
                value={inventory.length}
                color="text-slate-700 bg-slate-100"
              />
              <StatCard
                icon={<CheckCircle />}
                title="Stok Normal"
                value={inventory.filter((i) => i.status === 'normal').length}
                color="text-emerald-600 bg-emerald-50"
              />
              <StatCard
                icon={<AlertTriangle />}
                title="Stok Menipis (Warning)"
                value={inventory.filter((i) => i.status === 'warning').length}
                color="text-amber-600 bg-amber-50"
              />
              <StatCard
                icon={<AlertTriangle />}
                title="Stok Kritis / Habis"
                value={inventory.filter((i) => i.status === 'critical' || i.status === 'out_of_stock').length}
                color="text-red-600 bg-red-50"
              />
            </div>

            {/* Inventory Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Cari nama atau SKU bahan baku..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="normal">Normal</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="out_of_stock">Habis</option>
                </select>
              </div>

              <button
                onClick={() => handleOpenAdjustModal(inventory[0] || null)}
                className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition active:scale-95 whitespace-nowrap self-start md:self-auto"
              >
                <Plus className="w-4 h-4" /> Input Restock / Mutasi Stok
              </button>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-extrabold text-sm text-slate-800">
                  Stok Bahan Baku ({filteredInventory.length}) — {activeBranchName}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Nama Bahan Baku</th>
                      <th className="px-4 py-3">Cabang</th>
                      <th className="px-4 py-3">Stok Saat Ini</th>
                      <th className="px-4 py-3">Stok Minimum</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">{item.sku}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.branchName}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-900">
                          {item.quantity.toLocaleString('id-ID')} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {item.minimumStock.toLocaleString('id-ID')} {item.unit}
                        </td>
                        <td className="px-4 py-3">
                          <StockStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="bg-slate-100 hover:bg-fuchsia-50 hover:text-fuchsia-700 text-slate-700 font-bold py-1 px-3 rounded-lg text-xs transition"
                          >
                            Penyesuaian
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: RECIPES / BOM (Bill of Materials)
           ========================================================================= */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50 p-4 rounded-2xl border border-fuchsia-100">
              <h2 className="font-extrabold text-sm text-fuchsia-950">
                Bill of Materials (BOM) & Komposisi Resep
              </h2>
              <p className="text-xs text-fuchsia-800 mt-1 leading-relaxed">
                Setiap transaksi pesanan yang berhasil secara otomatis memotong stok bahan baku berdasarkan formulasi resep di bawah ini.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((rec, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{rec.productName}</h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{rec.sku}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Resep Aktif
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Komposisi Bahan per Porsi:
                    </p>
                    <ul className="divide-y divide-slate-50">
                      {rec.ingredients.map((ing, iIdx) => (
                        <li key={iIdx} className="py-1.5 flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-700">{ing.name}</span>
                          <span className="font-mono font-bold text-fuchsia-700">
                            {ing.quantity} {ing.unit} {ing.note && <span className="text-[10px] text-pink-600">({ing.note})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ANALYTICS (Monitoring Penjualan)
           ========================================================================= */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fuchsia-600" />
                <span className="font-bold text-xs text-slate-700">Rentang Periode:</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { key: 'today', label: 'Hari Ini' },
                  { key: 'this_week', label: 'Minggu Ini' },
                  { key: 'this_month', label: 'Bulan Ini' },
                  { key: 'last_month', label: 'Bulan Lalu' },
                  { key: 'all_time', label: 'Semua Waktu' }
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPeriod(p.key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      selectedPeriod === p.key
                        ? 'bg-fuchsia-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                icon={<DollarSign />}
                title="Total Omzet Periode Ini"
                value={`Rp ${analytics.totalRevenue.toLocaleString('id-ID')}`}
                color="text-emerald-600 bg-emerald-50"
              />
              <StatCard
                icon={<ShoppingCart />}
                title="Total Transaksi Lunas"
                value={analytics.totalOrders}
                color="text-blue-600 bg-blue-50"
              />
              <StatCard
                icon={<BarChart3 />}
                title="Average Order Value (AOV)"
                value={`Rp ${analytics.averageOrderValue.toLocaleString('id-ID')}`}
                color="text-indigo-600 bg-indigo-50"
              />
              <StatCard
                icon={<Clock />}
                title="Omzet Hari Ini"
                value={`Rp ${analytics.todayRevenue.toLocaleString('id-ID')}`}
                color="text-fuchsia-600 bg-fuchsia-50"
              />
            </div>

            {/* Charts & Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales Bar Chart Simulation */}
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center justify-between">
                  <span>Tren Omzet Harian</span>
                  <span className="text-xs text-slate-400 font-normal">Grafik Harian</span>
                </h3>

                <div className="space-y-2 pt-2">
                  {analytics.dailyTrend.slice(-10).map((d, idx) => {
                    const maxRevenue = Math.max(...analytics.dailyTrend.map((x) => x.revenue), 1);
                    const percentage = Math.round((d.revenue / maxRevenue) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{d.date}</span>
                          <span className="font-bold text-slate-900">
                            Rp {d.revenue.toLocaleString('id-ID')} ({d.orders} order)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {analytics.dailyTrend.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-8">
                      Belum ada data transaksi pada rentang periode ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Cross-Branch Performance Comparison */}
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center justify-between">
                  <span>Perbandingan Performa Antar Cabang</span>
                  <span className="text-xs text-slate-400 font-normal">Kontribusi Omzet</span>
                </h3>

                <div className="space-y-3 pt-2">
                  {analytics.branchPerformance.map((b, idx) => {
                    const share =
                      analytics.totalRevenue > 0
                        ? Math.round((b.revenue / analytics.totalRevenue) * 100)
                        : 0;
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-xs text-slate-800">{b.branchName}</span>
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-900">
                            Rp {b.revenue.toLocaleString('id-ID')} ({share}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-fuchsia-600 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Total Transaksi: <strong>{b.orderCount} pesanan</strong> • Rata-rata per order:{' '}
                          <strong>Rp {b.orderCount > 0 ? Math.round(b.revenue / b.orderCount).toLocaleString('id-ID') : 0}</strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top 5 Products */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">
                Top 5 Produk Terlaris
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {analytics.topProducts.slice(0, 5).map((prod, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-full">
                      Peringkat #{idx + 1}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-1">{prod.name}</h4>
                    <p className="text-xs font-black text-slate-800">{prod.quantity} Porsi Terjual</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Rp {prod.revenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: REPORTS & CSV EXPORT (Laporan Penjualan)
           ========================================================================= */}
        {activeTab === 'reports' && analytics && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-base text-slate-900">
                  Laporan Rekapitulasi Penjualan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi penjualan terintegrasi untuk cabang {activeBranchName} (Zona Waktu: Asia/Jakarta)
                </p>
              </div>

              <button
                onClick={() => exportSalesReportToCSV(analytics, activeBranchName)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-sm transition active:scale-95 self-start md:self-auto"
              >
                <Download className="w-4 h-4" /> Unduh Laporan (CSV)
              </button>
            </div>

            {/* Report Table: Per Product */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                  Rincian Penjualan per Menu Produk
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-right">Kuantitas Terjual</th>
                      <th className="px-4 py-3 text-right">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{p.quantity} porsi</td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-fuchsia-700">
                          Rp {p.revenue.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                Penyesuaian / Restock Bahan Baku
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Bahan Baku</label>
                <select
                  value={selectedIngredient?.id || ''}
                  onChange={(e) => {
                    const match = inventory.find((i) => (i.ingredientId || i.id) === e.target.value);
                    if (match) setSelectedIngredient(match);
                  }}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  {inventory.map((ing) => (
                    <option key={ing.id} value={ing.ingredientId || ing.id}>
                      {ing.name} ({ing.sku}) — Sisa: {ing.quantity} {ing.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Tipe Mutasi</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="purchase">Pembelian / Restock Masuk (+)</option>
                  <option value="adjustment_in">Koreksi Tambah (+)</option>
                  <option value="adjustment_out">Koreksi Kurang (-)</option>
                  <option value="spoilage">Kadaluarsa / Rusak (-)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Jumlah Kuantitas ({selectedIngredient?.unit || 'unit'})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Contoh: 1000"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Catatan / Alasan</label>
                <textarea
                  placeholder="Contoh: Restock mingguan supplier A..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Menyimpan...' : 'Simpan Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-3.5">
    <div className={`p-2.5 rounded-xl ${color}`}>
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
      <p className="text-base md:text-lg font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

const StockStatusBadge = ({ status }) => {
  switch (status) {
    case 'out_of_stock':
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Habis</span>;
    case 'critical':
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">Kritis</span>;
    case 'warning':
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Menipis</span>;
    case 'normal':
    default:
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Normal</span>;
  }
};
