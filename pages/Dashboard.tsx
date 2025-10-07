import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.tsx';
import { SummaryReport } from '../types/index.ts';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchReport = async () => {
      if (!user || !user.token) {
        toast.error('Session expired. Please log in again.');
        logout();
        return;
      }

      try {
        setLoading(true);
        const today = new Date();
        const from = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
        const to = format(today, 'yyyy-MM-dd');

        const { data } = await api.get<SummaryReport>(
          `/api/reports/summary?from=${from}&to=${to}&period=daily`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setReport(data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error('Unauthorized. Please log in again.');
          logout();
        } else {
          toast.error('Failed to fetch dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [user, logout]);

  const formatTrendData = (data: SummaryReport['salesTrend']) => {
    return data.map((item) => ({
      name: `${item._id.day}/${item._id.month}`,
      Sales: item.sales,
      Profit: item.profit,
    }));
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-600">Loading dashboard...</div>;
  }

  if (!report) {
    return (
      <div className="text-center p-8 text-red-600">
        Could not load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales (This Month)"
          value={`KES ${report.summary.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Gross Profit (This Month)"
          value={`KES ${report.summary.grossProfit.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Expenses (This Month)"
          value={`KES ${report.summary.totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="bg-orange-500"
        />
        <StatCard
          title="Net Profit (This Month)"
          value={`KES ${report.summary.netProfit.toLocaleString()}`}
          icon={DollarSign}
          color={
            report.summary.netProfit >= 0 ? 'bg-green-600' : 'bg-red-500'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Sales & Profit Trend (Daily)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatTrendData(report.salesTrend)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `KES ${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Sales"
                stroke="#3b82f6"
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="Profit" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-slate-700">
              Low Stock Items ({report.summary.lowStockCount})
            </h2>
          </div>
          {report.lowStockItems.length > 0 ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {report.lowStockItems.map((item) => (
                <li
                  key={item._id}
                  className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50"
                >
                  <span>{item.name}</span>
                  <span className="font-bold text-red-600">
                    {item.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-center pt-10">
              No items are low on stock. Great!
            </p>
          )}
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Top Selling Items (This Month)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={report.topSellingItems}
            layout="vertical"
            margin={{ left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="_id" type="category" width={100} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} ${
                  name === 'totalRevenue' ? 'KES' : 'units'
                }`,
                name === 'totalRevenue' ? 'Revenue' : 'Quantity Sold',
              ]}
            />
            <Legend />
            <Bar dataKey="totalQuantity" name="Quantity Sold" fill="#3b82f6" />
            <Bar dataKey="totalRevenue" name="Revenue" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
