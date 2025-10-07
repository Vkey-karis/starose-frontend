
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import { Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-slate-100">
            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden fixed top-4 left-4 z-20">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 bg-white rounded-md shadow-md text-slate-600"
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-10`}>
                <Sidebar />
            </div>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
                     <div className="mt-12 md:mt-0">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Layout;
