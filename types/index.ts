
export interface User {
    _id: string;
    email: string;
    role: string;
    token: string;
}

export interface Item {
    _id: string;
    name: string;
    category: string;
    buyingPrice: number;
    defaultSellingPrice: number;
    quantity: number;
    lastRestockDate: string;
    lowStockThreshold: number;
    sku?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Sale {
    _id: string;
    itemId: Item | string;
    itemName: string;
    quantitySold: number;
    actualSellingPrice: number;
    totalSale: number;
    profit: number;
    date: string;
    paymentMethod: 'Cash' | 'Mpesa';
    attendant: string;
    notes?: string;
    createdAt: string;
}

export interface Expense {
    _id: string;
    amount: number;
    category: 'rent' | 'utilities' | 'wages' | 'supplies' | 'other';
    date: string;
    description: string;
    recurring: boolean;
    attendant?: string;
    createdAt: string;
}

export interface SummaryReport {
    summary: {
        totalSales: number;
        grossProfit: number;
        totalExpenses: number;
        netProfit: number;
        lowStockCount: number;
    };
    topSellingItems: {
        _id: string;
        totalQuantity: number;
        totalRevenue: number;
    }[];
    lowStockItems: Item[];
    salesTrend: {
        _id: {
            year: number;
            month: number;
            day?: number;
            week?: number;
        };
        sales: number;
        profit: number;
    }[];
}
