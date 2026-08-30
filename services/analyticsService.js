import { supabase } from '../supabaseClient';
import { fetchOrders } from './orderService';

export function getDateRangeBounds(periodKey) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (periodKey) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'all_time':
    default:
      start = new Date(2020, 0, 1);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export async function fetchAnalyticsData(branchId = null, periodKey = 'this_month') {
  const { start, end } = getDateRangeBounds(periodKey);
  const orders = await fetchOrders(branchId);

  // Filter valid paid orders within the period
  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.createdAt || o.created_at);
    const inRange = d >= start && d <= end;
    const isPaid = o.paymentStatus === 'completed' || o.paymentStatus === 'paid';
    const notCancelled = o.status !== 'cancelled';
    return inRange && isPaid && notCancelled;
  });

  // KPI Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Today's metrics
  const todayBounds = getDateRangeBounds('today');
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt || o.created_at);
    const isToday = d >= todayBounds.start && d <= todayBounds.end;
    const isPaid = o.paymentStatus === 'completed' || o.paymentStatus === 'paid';
    return isToday && isPaid && o.status !== 'cancelled';
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  // Product sales aggregation
  const productMap = {};
  filteredOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const name = item.name || 'Menu';
      if (!productMap[name]) {
        productMap[name] = { name, quantity: 0, revenue: 0 };
      }
      productMap[name].quantity += Number(item.quantity) || 1;
      productMap[name].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);

  // Branch performance breakdown
  const branchMap = {};
  filteredOrders.forEach((o) => {
    const bName = o.branchName || 'Cabang Tunjungan';
    if (!branchMap[bName]) {
      branchMap[bName] = { branchName: bName, orderCount: 0, revenue: 0 };
    }
    branchMap[bName].orderCount += 1;
    branchMap[bName].revenue += Number(o.totalPrice) || 0;
  });
  const branchPerformance = Object.values(branchMap).sort((a, b) => b.revenue - a.revenue);

  // Daily revenue trend (last 14-30 days)
  const dailyMap = {};
  filteredOrders.forEach((o) => {
    const dStr = new Date(o.createdAt || o.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
    if (!dailyMap[dStr]) {
      dailyMap[dStr] = { date: dStr, revenue: 0, orders: 0 };
    }
    dailyMap[dStr].revenue += Number(o.totalPrice) || 0;
    dailyMap[dStr].orders += 1;
  });
  const dailyTrend = Object.values(dailyMap);

  return {
    period: periodKey,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    todayRevenue,
    todayOrdersCount: todayOrders.length,
    topProducts,
    branchPerformance,
    dailyTrend,
    rawOrdersCount: filteredOrders.length
  };
}

export function exportSalesReportToCSV(analyticsData, branchName = 'Semua Cabang') {
  const { period, totalRevenue, totalOrders, averageOrderValue, topProducts, branchPerformance } = analyticsData;

  let csvContent = 'data:text/csv;charset=utf-8,';

  // 1. Header Section
  csvContent += `LAPORAN PENJUALAN HOLI FOOD MULTI-CABANG\n`;
  csvContent += `Cabang:,"${branchName}"\n`;
  csvContent += `Periode:,"${period}"\n`;
  csvContent += `Tanggal Export:,"${new Date().toLocaleString('id-ID')}"\n\n`;

  // 2. Summary KPIs
  csvContent += `RINGKASAN EKSEKUTIF\n`;
  csvContent += `Metrik,Nilai\n`;
  csvContent += `Total Omzet,Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
  csvContent += `Total Transaksi,${totalOrders}\n`;
  csvContent += `Average Order Value (AOV),Rp ${averageOrderValue.toLocaleString('id-ID')}\n\n`;

  // 3. Product Performance Table
  csvContent += `PERFORMA PENJUALAN PRODUK\n`;
  csvContent += `No,Nama Menu,Jumlah Terjual,Total Penjualan\n`;
  topProducts.forEach((p, idx) => {
    csvContent += `${idx + 1},"${p.name}",${p.quantity},Rp ${p.revenue.toLocaleString('id-ID')}\n`;
  });
  csvContent += `\n`;

  // 4. Branch Performance Table
  csvContent += `PERFORMA ANTAR CABANG\n`;
  csvContent += `No,Nama Cabang,Jumlah Transaksi,Total Omzet,Rata-rata Order\n`;
  branchPerformance.forEach((b, idx) => {
    const aov = b.orderCount > 0 ? Math.round(b.revenue / b.orderCount) : 0;
    csvContent += `${idx + 1},"${b.branchName}",${b.orderCount},Rp ${b.revenue.toLocaleString('id-ID')},Rp ${aov.toLocaleString('id-ID')}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Laporan_Penjualan_${period}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
