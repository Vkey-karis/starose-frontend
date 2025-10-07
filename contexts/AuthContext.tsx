
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types/index.ts';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('staroseUser');
        if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            // Check if token is expired
            const decodedToken: { exp: number } = jwtDecode(parsedUser.token);
            if (decodedToken.exp * 1000 < Date.now()) {
                logout();
            } else {
                setUser(parsedUser);
            }
        }
    }, []);

    const login = (userData: User) => {
        localStorage.setItem('staroseUser', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('staroseUser');
        setUser(null);
    };
    
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
