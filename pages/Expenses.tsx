
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../contexts/AuthContext.tsx';
import toast from 'react-hot-toast';
import { Expense } from '../types/index.ts';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AddExpenseForm: React.FC<{ onExpenseAdded: () => void }> = ({ onExpenseAdded }) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<'rent' | 'utilities' | 'wages' | 'supplies' | 'other'>('other');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            await api.post('/expenses', { amount: Number(amount), category, description, date }, config);
            toast.success('Expense added successfully!');
            setAmount('');
            setDescription('');
            onExpenseAdded();
        } catch (error) {
            toast.error('Failed to add expense.');
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div>
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as any)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                            <option value="supplies">Supplies</option>
                            <option value="wages">Wages</option>
                            <option value="utilities">Utilities</option>
                            <option value="rent">Rent</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Amount (KES)</label>
                        <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                     <div className="lg:col-span-2">
                        <label className="block text-sm font-medium">Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                </div>
                 <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 disabled:bg-primary-300">
                        {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const Expenses: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const { user } = useAuth();
    
    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            const { data } = await api.get(`/expenses?page=${page}`, config);
            setExpenses(data.expenses);
            setPages(data.pages);
        } catch (error) {
            toast.error('Failed to fetch expenses.');
        } finally {
            setLoading(false);
        }
    }, [user?.token, page]);
    
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
            
            <AddExpenseForm onExpenseAdded={fetchExpenses} />
            
             <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Expense History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                             <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                         <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-8">Loading expenses...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8">No expenses recorded.</td></tr>
                            ) : (
                                expenses.map(expense => (
                                    <tr key={expense._id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4">{format(new Date(expense.date), 'dd MMM, yyyy')}</td>
                                        <td className="px-6 py-4 capitalize">{expense.category}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{expense.description}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">KES {expense.amount.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                 <div className="flex justify-between items-center mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-50">
                        <ChevronLeft size={16} className="mr-1"/> Previous
                    </button>
                    <span>Page {page} of {pages}</span>
                    <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-50">
                        Next <ChevronRight size={16} className="ml-1"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
