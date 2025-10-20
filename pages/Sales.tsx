import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.tsx';
import toast from 'react-hot-toast';
import { Item, Sale } from '../types/index.ts';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../api/axiosInstance.ts';

// =============================
// Record Sale Form Component
// =============================
const RecordSaleForm: React.FC<{ onSaleRecorded: () => void }> = ({ onSaleRecorded }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantitySold, setQuantitySold] = useState(1);
  const [actualSellingPrice, setActualSellingPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mpesa'>('Cash');
  const [attendant, setAttendant] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // ✅ Fetch all items in inventory (no pagination or search)
  const fetchAllItems = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await api.get('/items', config);
      setItems(data.items || []);
    } catch (error) {
      toast.error("Couldn't load inventory items.");
    }
  }, [user?.token]);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    setSelectedItemId(itemId);
    const selectedItem = items.find(i => i._id === itemId);
    if (selectedItem) {
      setActualSellingPrice(selectedItem.defaultSellingPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const selectedItem = items.find(i => i._id === selectedItemId);
    const crossesThreshold =
      selectedItem &&
      selectedItem.quantity > selectedItem.lowStockThreshold &&
      selectedItem.quantity - Number(quantitySold) <= selectedItem.lowStockThreshold;

    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const saleData = {
        itemId: selectedItemId,
        quantitySold: Number(quantitySold),
        actualSellingPrice: Number(actualSellingPrice),
        paymentMethod,
        attendant,
      };
      await api.post('/sales', saleData, config);
      toast.success('Sale recorded successfully!');

      if (crossesThreshold && selectedItem) {
        const newQuantity = selectedItem.quantity - Number(quantitySold);
        toast.error(`${selectedItem.name} is now low on stock! Only ${newQuantity} left.`, {
          icon: '⚠️',
        });
      }

      // Reset form
      setSelectedItemId('');
      setQuantitySold(1);
      setActualSellingPrice(0);
      setAttendant('');
      onSaleRecorded();
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data.message
          : 'Failed to record sale.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find(i => i._id === selectedItemId);
  const profitPreview = selectedItem
    ? (actualSellingPrice - selectedItem.buyingPrice) * quantitySold
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Record New Sale</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Item Dropdown */}
          <div>
            <label className="block text-sm font-medium">Item</label>
            <select
              value={selectedItemId}
              onChange={handleItemChange}
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Select an item</option>
              {items.map(item => (
                <option key={item._id} value={item._id}>
                  {item.name} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Quantity Sold</label>
            <input
              type="number"
              min="1"
              value={quantitySold}
              onChange={e => setQuantitySold(Number(e.target.value))}
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Actual Selling Price (per item)
            </label>
            <input
              type="number"
              value={actualSellingPrice}
              onChange={e => setActualSellingPrice(Number(e.target.value))}
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Mpesa')}
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            >
              <option>Cash</option>
              <option>Mpesa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Attendant</label>
            <input
              type="text"
              value={attendant}
              onChange={e => setAttendant(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !selectedItemId}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 disabled:bg-primary-300"
            >
              {loading ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </div>

        {selectedItemId && (
          <div className="bg-slate-50 p-3 rounded-md text-sm grid grid-cols-2">
            <p>
              Total Sale:{' '}
              <span className="font-bold">
                KES {(actualSellingPrice * quantitySold).toLocaleString()}
              </span>
            </p>
            <p>
              Est. Profit:{' '}
              <span
                className={`font-bold ${
                  profitPreview >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                KES {profitPreview.toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

// =============================
// Sales Page
// =============================
const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await api.get(`/sales?page=${page}&itemName=${searchTerm}`, config);
      setSales(data.sales);
      setPages(data.pages);
    } catch (error) {
      toast.error('Failed to fetch sales records.');
    } finally {
      setLoading(false);
    }
  }, [user?.token, page, searchTerm]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Sales</h1>

      <RecordSaleForm onSaleRecorded={fetchSales} />

      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Sales</h2>

        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-1/3 pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Qty</th>
                <th className="px-6 py-3">Total Sale</th>
                <th className="px-6 py-3">Profit</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Attendant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    Loading sales...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    No sales found.
                  </td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr
                    key={sale._id}
                    className="bg-white border-b hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      {format(new Date(sale.date), 'dd MMM, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {sale.itemName}
                    </td>
                    <td className="px-6 py-4">{sale.quantitySold}</td>
                    <td className="px-6 py-4">
                      KES {sale.totalSale.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 font-bold ${
                        sale.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      KES {sale.profit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{sale.paymentMethod}</td>
                    <td className="px-6 py-4">{sale.attendant}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-50"
          >
            <ChevronLeft size={16} className="mr-1" /> Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-50"
          >
            Next <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
