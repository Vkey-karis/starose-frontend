
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Banknote, BarChart2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import toast from 'react-hot-toast';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Expenses', path: '/expenses', icon: Banknote },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
    // { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <aside className="w-64 h-full bg-slate-800 text-slate-200 flex flex-col">
            <div className="p-6 text-center border-b border-slate-700">
                <h1 className="text-2xl font-bold text-white">Starose</h1>
                <p className="text-sm text-slate-400">Cyber Café</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                                isActive
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'hover:bg-slate-700 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 rounded-lg text-slate-300 hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
