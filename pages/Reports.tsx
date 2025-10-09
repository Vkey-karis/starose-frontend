import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.tsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { SummaryReport } from '../types/index.ts';
import { FileDown, BarChart, FileSpreadsheet, FileText } from 'lucide-react';
import { saveAs } from 'file-saver';
import api from '../api/axiosInstance.ts';

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-slate-50 p-4 rounded-lg text-center">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

const Reports: React.FC = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [fromDate, setFromDate] = useState(format(firstDayOfMonth, 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(today, 'yyyy-MM-dd'));
  const [report, setReport] = useState<SummaryReport['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<null | 'pdf' | 'excel'>(null);
  const { user, logout } = useAuth();

  const generateReport = async () => {
    if (!user || !user.token) {
      toast.error('Session expired. Please log in again.');
      logout();
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const { data } = await axios.get<SummaryReport>(
        `/reports/summary?from=${fromDate}&to=${toDate}`,
        config
      );

      setReport(data.summary);
      toast.success('Report generated successfully');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please log in again.');
        logout();
      } else {
        toast.error('Failed to generate report.');
      }
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (formatType: 'pdf' | 'excel') => {
    if (!user || !user.token) {
      toast.error('Session expired. Please log in again.');
      logout();
      return;
    }

    setExporting(formatType);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob' as const,
      };

      const response = await api.get(
        `/reports/export?from=${fromDate}&to=${toDate}&format=${formatType}`,
        config
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });

      saveAs(
        blob,
        `Starose_Report_${fromDate}_to_${toDate}.${
          formatType === 'excel' ? 'xlsx' : 'pdf'
        }`
      );

      toast.success(`${formatType.toUpperCase()} export complete.`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please log in again.');
        logout();
      } else {
        toast.error(`Failed to export as ${formatType.toUpperCase()}.`);
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Reports</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Generate Financial Report
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 disabled:bg-primary-300"
          >
            <BarChart size={20} className="mr-2" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Report Summary</h2>
            <p className="text-slate-500">
              From {format(new Date(fromDate), 'dd MMM yyyy')} to{' '}
              {format(new Date(toDate), 'dd MMM yyyy')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sales"
              value={`KES ${report.totalSales.toLocaleString()}`}
            />
            <StatCard
              title="Gross Profit"
              value={`KES ${report.grossProfit.toLocaleString()}`}
            />
            <StatCard
              title="Total Expenses"
              value={`KES ${report.totalExpenses.toLocaleString()}`}
            />
            <div
              className={`p-4 rounded-lg text-center ${
                report.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <p
                className={`text-sm ${
                  report.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                Net Profit
              </p>
              <p
                className={`text-2xl font-bold ${
                  report.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
                }`}
              >
                KES {report.netProfit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Export Report:</h3>
            <button
              onClick={() => handleExport('excel')}
              disabled={!!exporting}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300"
            >
              {exporting === 'excel' ? (
                'Exporting...'
              ) : (
                <>
                  <FileSpreadsheet size={20} className="mr-2" /> Export as Excel
                </>
              )}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 disabled:bg-red-300"
            >
              {exporting === 'pdf' ? (
                'Exporting...'
              ) : (
                <>
                  <FileText size={20} className="mr-2" /> Export as PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
