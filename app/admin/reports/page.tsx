// app/admin/reports/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ReportData {
  // Financial
  revenue: { total: number; dogs: number; products: number };
  profit: { total: number; dogs: number; products: number };
  expenses: { total: number; byCategory: Record<string, number> };
  
  // Dogs
  dogs: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    byType: { puppies: number; studs: number; females: number };
  };
  
  // Products
  products: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  
  // Sales
  sales: {
    count: number;
    pending: number;
    completed: number;
  };
  
  // Trends
  trends: {
    daily: { date: string; revenue: number }[];
    topProducts: { name: string; count: number; revenue: number }[];
    topDogs: { name: string; count: number; revenue: number }[];
  };
  
  // Stock Alerts
  stockAlerts: {
    lowStock: any[];
    outOfStock: any[];
  };
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<ReportData>({
    revenue: { total: 0, dogs: 0, products: 0 },
    profit: { total: 0, dogs: 0, products: 0 },
    expenses: { total: 0, byCategory: {} },
    dogs: {
      total: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      byType: { puppies: 0, studs: 0, females: 0 }
    },
    products: {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0
    },
    sales: {
      count: 0,
      pending: 0,
      completed: 0
    },
    trends: {
      daily: [],
      topProducts: [],
      topDogs: []
    },
    stockAlerts: {
      lowStock: [],
      outOfStock: []
    }
  });

  useEffect(() => {
    fetchAllReports();
  }, [period]);

  const fetchAllReports = async () => {
    setLoading(true);
    
    // Date range
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

    try {
      // Fetch all data in parallel
      const [
        salesData,
        dogsData,
        productsData,
        expensesData,
        ordersData
      ] = await Promise.all([
        supabase.from('sales').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('dogs').select('*'),
        supabase.from('products').select('*'),
        supabase.from('expenses').select('*').gte('date', startDate.toISOString().split('T')[0]),
        supabase.from('orders').select('*').gte('created_at', startDate.toISOString())
      ]);

      const sales = salesData.data || [];
      const dogs = dogsData.data || [];
      const products = productsData.data || [];
      const expenses = expensesData.data || [];
      const orders = ordersData.data || [];

      // Calculate financials
      const dogSales = sales.filter(s => s.item_type === 'dog');
      const productSales = sales.filter(s => s.item_type === 'product');
      
      const dogRevenue = dogSales.reduce((sum, s) => sum + s.price, 0);
      const productRevenue = productSales.reduce((sum, s) => sum + s.price, 0);
      
      const dogProfit = dogSales.reduce((sum, s) => sum + (s.profit || 0), 0);
      const productProfit = productSales.reduce((sum, s) => sum + (s.profit || 0), 0);

      // Dog statistics
      const dogStats = {
        total: dogs.length,
        available: dogs.filter(d => d.status === 'available').length,
        reserved: dogs.filter(d => d.status === 'reserved').length,
        sold: dogs.filter(d => d.status === 'sold').length,
        byType: {
          puppies: dogs.filter(d => d.type === 'puppy').length,
          studs: dogs.filter(d => d.type === 'stud').length,
          females: dogs.filter(d => d.type === 'female').length
        }
      };

      // Product statistics
      const productStats = {
        total: products.length,
        inStock: products.filter(p => p.in_stock && p.stock > 0).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock < 5).length,
        outOfStock: products.filter(p => !p.in_stock || p.stock === 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0)
      };

      // Sales statistics
      const saleStats = {
        count: sales.length + orders.length,
        pending: sales.filter(s => s.payment_status === 'pending').length + 
                 orders.filter(o => o.payment_status === 'pending').length,
        completed: sales.filter(s => s.payment_status === 'paid').length + 
                   orders.filter(o => o.payment_status === 'paid').length
      };

      // Expenses by category
      const expensesByCat = expenses.reduce((acc: any, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});

      // Top selling products
      const productSalesMap = productSales.reduce((acc: any, sale) => {
        const key = sale.item_name || 'Unknown';
        if (!acc[key]) acc[key] = { count: 0, revenue: 0 };
        acc[key].count += sale.quantity || 1;
        acc[key].revenue += sale.price;
        return acc;
      }, {});

      const topProducts = Object.entries(productSalesMap)
        .map(([name, stats]: [string, any]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top selling dogs
      const dogSalesMap = dogSales.reduce((acc: any, sale) => {
        const key = sale.item_name || 'Unknown';
        if (!acc[key]) acc[key] = { count: 0, revenue: 0 };
        acc[key].count += sale.quantity || 1;
        acc[key].revenue += sale.price;
        return acc;
      }, {});

      const topDogs = Object.entries(dogSalesMap)
        .map(([name, stats]: [string, any]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Stock alerts
      const lowStock = products.filter(p => p.stock > 0 && p.stock < 5);
      const outOfStock = products.filter(p => !p.in_stock || p.stock === 0);

      // Daily trends (last 7 days)
      const dailyMap: Record<string, number> = {};
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      sales.forEach(sale => {
        const date = sale.sale_date || sale.created_at.split('T')[0];
        if (last7Days.includes(date)) {
          dailyMap[date] = (dailyMap[date] || 0) + sale.price;
        }
      });

      const dailyTrends = last7Days.map(date => ({
        date,
        revenue: dailyMap[date] || 0
      }));

      setData({
        revenue: { total: dogRevenue + productRevenue, dogs: dogRevenue, products: productRevenue },
        profit: { total: dogProfit + productProfit, dogs: dogProfit, products: productProfit },
        expenses: { total: expenses.reduce((sum, e) => sum + e.amount, 0), byCategory: expensesByCat },
        dogs: dogStats,
        products: productStats,
        sales: saleStats,
        trends: {
          daily: dailyTrends,
          topProducts,
          topDogs
        },
        stockAlerts: {
          lowStock,
          outOfStock
        }
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">📊 Business Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Complete overview of your kennel business</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  period === p ? 'bg-black text-white' : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">₦{data.revenue.total.toLocaleString()}</p>
            <div className="mt-2 text-xs text-gray-500">
              <span className="inline-block mr-3">🐕 Dogs: ₦{data.revenue.dogs.toLocaleString()}</span>
              <span>🛍️ Products: ₦{data.revenue.products.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Profit</p>
            <p className="text-3xl font-bold text-blue-600">₦{data.profit.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              Margin: {data.revenue.total ? ((data.profit.total / data.revenue.total) * 100).toFixed(1) : '0'}%
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-3xl font-bold text-red-600">₦{data.expenses.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              Net Income: ₦{(data.profit.total - data.expenses.total).toLocaleString()}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-3xl font-bold">{data.sales.count}</p>
            <p className="text-xs text-gray-500 mt-2">
              {data.sales.pending} pending • {data.sales.completed} completed
            </p>
          </div>
        </div>

        {/* Dog & Product Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Dog Statistics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🐕</span> Dog Inventory
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">{data.dogs.total}</p>
                <p className="text-xs text-gray-600">Total Dogs</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">{data.dogs.available}</p>
                <p className="text-xs text-gray-600">Available</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <p className="text-2xl font-bold text-yellow-600">{data.dogs.reserved}</p>
                <p className="text-xs text-gray-600">Reserved</p>
              </div>
              <div className="text-center p-3 bg-gray-100 rounded">
                <p className="text-2xl font-bold text-gray-600">{data.dogs.sold}</p>
                <p className="text-xs text-gray-600">Sold</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="font-bold">{data.dogs.byType.puppies}</p>
                <p className="text-gray-500">Puppies</p>
              </div>
              <div>
                <p className="font-bold">{data.dogs.byType.studs}</p>
                <p className="text-gray-500">Studs</p>
              </div>
              <div>
                <p className="font-bold">{data.dogs.byType.females}</p>
                <p className="text-gray-500">Females</p>
              </div>
            </div>
          </div>

          {/* Product Statistics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🛍️</span> Product Inventory
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded">
                <p className="text-2xl font-bold text-purple-600">{data.products.total}</p>
                <p className="text-xs text-gray-600">Total Products</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">{data.products.inStock}</p>
                <p className="text-xs text-gray-600">In Stock</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <p className="text-2xl font-bold text-yellow-600">{data.products.lowStock}</p>
                <p className="text-xs text-gray-600">Low Stock</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <p className="text-2xl font-bold text-red-600">{data.products.outOfStock}</p>
                <p className="text-xs text-gray-600">Out of Stock</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-blue-600">₦{data.products.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Top Selling Dogs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🏆</span> Top Selling Dogs
            </h2>
            <div className="space-y-3">
              {data.trends.topDogs.length > 0 ? (
                data.trends.topDogs.map((dog: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{dog.name}</p>
                      <p className="text-xs text-gray-500">{dog.count} sold</p>
                    </div>
                    <p className="font-bold text-green-600">₦{dog.revenue.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No dog sales yet</p>
              )}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🏆</span> Top Selling Products
            </h2>
            <div className="space-y-3">
              {data.trends.topProducts.length > 0 ? (
                data.trends.topProducts.map((product: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.count} sold</p>
                    </div>
                    <p className="font-bold text-green-600">₦{product.revenue.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No product sales yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        {(data.stockAlerts.lowStock.length > 0 || data.stockAlerts.outOfStock.length > 0) && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>⚠️</span> Stock Alerts
            </h2>
            
            {data.stockAlerts.lowStock.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-yellow-600 mb-2">Low Stock (Less than 5)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.stockAlerts.lowStock.map((item: any) => (
                    <div key={item.id} className="bg-yellow-50 p-2 rounded text-sm">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-yellow-600">Stock: {item.stock}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.stockAlerts.outOfStock.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2">Out of Stock</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.stockAlerts.outOfStock.map((item: any) => (
                    <div key={item.id} className="bg-red-50 p-2 rounded text-sm">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-red-600">Restock needed</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📈</span> Daily Revenue Trend ({period})
          </h2>
          <div className="space-y-2">
            {data.trends.daily.map((day: any) => {
              const maxRevenue = Math.max(...data.trends.daily.map(d => d.revenue), 1);
              return (
                <div key={day.date} className="flex items-center gap-2">
                  <span className="text-sm w-24">{new Date(day.date).toLocaleDateString()}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-600 h-4 rounded-full" 
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-24 text-right">₦{day.revenue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}