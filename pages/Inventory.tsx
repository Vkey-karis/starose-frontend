import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import toast from 'react-hot-toast';
import { Item } from '../types/index.ts';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axiosInstance.ts';

// Modal component for adding/editing items
const ItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    item: Partial<Item> | null;
}> = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState<Partial<Item>>({});
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    
    useEffect(() => {
        setFormData(item || { name: '', category: '', buyingPrice: 0, defaultSellingPrice: 0, quantity: 0, lowStockThreshold: 5 });
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            if (formData._id) {
                const crossesThreshold =
                    item && // is an update
                    item.quantity > item.lowStockThreshold && // was not low
                    Number(formData.quantity) <= Number(formData.lowStockThreshold); // is now low

                await axios.put(`/items/${formData._id}`, formData, config);
                toast.success('Item updated successfully');

                if (crossesThreshold) {
                    toast.error(`${formData.name} is now low on stock! Only ${formData.quantity} left.`, {
                        icon: '⚠️',
                    });
                }
            } else {
                await axios.post('/api/items', formData, config);
                toast.success('Item added successfully');
                if (Number(formData.quantity) <= Number(formData.lowStockThreshold)) {
                     toast.error(`${formData.name} was added with low stock!`, {
                        icon: '⚠️',
                    });
                }
            }
            onSave();
            onClose();
        } catch (error) {
            toast.error('Failed to save item.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{formData._id ? 'Edit Item' : 'Add New Item'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Name</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Category</label>
                            <input type="text" name="category" value={formData.category || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"/>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Buying Price (KES)</label>
                            <input type="number" name="buyingPrice" value={formData.buyingPrice || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Selling Price (KES)</label>
                            <input type="number" name="defaultSellingPrice" value={formData.defaultSellingPrice || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Quantity</label>
                            <input type="number" name="quantity" value={formData.quantity || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Low Stock Threshold</label>
                            <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"/>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Inventory: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<Item> | null>(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { user } = useAuth();

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            const { data } = await api.get(`/items?page=${page}&keyword=${searchTerm}`, config);
            setItems(data.items);
            setPages(data.pages);
        } catch (error) {
            toast.error('Failed to fetch inventory items.');
        } finally {
            setLoading(false);
        }
    }, [user?.token, page, searchTerm]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    const handleOpenModal = (item: Partial<Item> | null = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                await axios.delete(`/items/${id}`, config);
                toast.success('Item deleted successfully');
                fetchItems();
            } catch (error) {
                toast.error('Failed to delete item.');
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Inventory</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700">
                    <Plus size={20} className="mr-2" />
                    Add Item
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input
                    type="text"
                    placeholder="Search items by name..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Reset to first page on search
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Quantity</th>
                            <th scope="col" className="px-6 py-3">Buying Price</th>
                            <th scope="col" className="px-6 py-3">Selling Price</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">Loading inventory...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8">No items found.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item._id} className={`bg-white border-b hover:bg-slate-50 ${item.quantity <= item.lowStockThreshold ? 'bg-red-50' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                                    <td className="px-6 py-4">{item.category}</td>
                                    <td className={`px-6 py-4 font-bold ${item.quantity <= item.lowStockThreshold ? 'text-red-600' : 'text-slate-700'}`}>{item.quantity}</td>
                                    <td className="px-6 py-4">KES {item.buyingPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4">KES {item.defaultSellingPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={18}/></button>
                                            <button onClick={() => handleDelete(item._id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-50">
                    <ChevronLeft size={16} className="mr-1"/> Previous
                </button>
                <span>Page {page} of {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="flex items-center px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-50">
                    Next <ChevronRight size={16} className="ml-1"/>
                </button>
            </div>

            <ItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={fetchItems} item={currentItem} />
        </div>
    );
};

export default Inventory;