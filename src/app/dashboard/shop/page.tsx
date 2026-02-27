'use client';

import { useState, useEffect } from 'react';
import { posApi, financeApi } from '@/lib/api';
import { getSafeUser } from '@/lib/auth';
import { toast } from '@/lib/toast-events';

type Product = {
    id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
};

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const user = getSafeUser();
            if (user) {
                const sid = user.studentId || user.children?.[0]?.id;
                setStudentId(sid);

                // Fetch wallet balance
                if (sid) {
                    try {
                        const walletRes = await financeApi.fetchWalletHistory(sid);
                        // fetchWalletHistory returns unwrapped data: plain array or { transactions, balance }
                        const resAny = walletRes as any;
                        const history = resAny?.transactions ?? (Array.isArray(walletRes) ? walletRes : []);
                        // Calculate balance from transactions or use a balance field
                        const balance = resAny?.balance ?? history.reduce((acc: number, t: any) => {
                            return acc + (t.type === 'CREDIT' ? t.amount : -t.amount);
                        }, 0);
                        setWalletBalance(balance);
                    } catch {
                        // Wallet might not be available — 404 shows no balance (soft miss)
                    }
                }
            }

            try {
                const res = await posApi.fetchProducts();
                // res is now plain data: either { products: [...] } or [...]
                const data = (res as any)?.products ?? (Array.isArray(res) ? res : []);
                setProducts(data);
            } catch (err: any) {
                console.error('Failed to load products', err);
                // 404 means no products exist for this tenant yet — show empty state
                if (err.name === 'ApiEnvelopeError' && err.code === 'NOT_FOUND') {
                    setProducts([]);
                } else {
                    setError(err.message || 'Failed to load shop products');
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleBuy = async (product: Product) => {
        if (!studentId) {
            toast.error('No student linked to this account');
            return;
        }

        try {
            await posApi.createOrder(studentId, [{ productId: product.id, quantity: 1 }]);
            // Refresh balance
            if (walletBalance !== null) {
                setWalletBalance(prev => (prev ?? 0) - product.price);
            }
        } catch (err) {
            // toast is handled by posApi
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading shop...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 mb-1">Canteen Shop</h1>
                    <p className="text-gray-500">Browse items available at the school canteen</p>
                </div>
                {walletBalance !== null && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-6 py-3 text-center">
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Wallet Balance</p>
                        <p className="text-2xl font-black text-green-700">${walletBalance.toFixed(2)}</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-6">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            {products.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-3xl border-dashed border-2 border-gray-200">
                    <div className="text-6xl mb-4 opacity-20">🛒</div>
                    <p className="text-gray-400 font-medium">No products available right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-40 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-6xl">
                                {product.category === 'drink' ? '🥤'
                                    : product.category === 'snack' ? '🍿'
                                        : '🍽️'}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                                <p className="text-xs text-gray-400 mb-3">{product.category || 'Item'}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-black text-indigo-600">${product.price.toFixed(2)}</span>
                                    <button
                                        onClick={() => handleBuy(product)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                                    >
                                        Buy
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
