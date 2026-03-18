'use client';

import { useState, useEffect } from 'react';
import { posApi, financeApi } from '@/lib/api';
import { toast } from '@/lib/toast-events';
import { CardsSkeleton } from '@/components/ui/Skeletons';
import { useLang } from '@/lib/LangProvider';

type Product = {
    id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
};

type CartItem = {
    product: Product;
    quantity: number;
};

export default function POSTerminalPage() {
    const { t } = useLang();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('ALL');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await posApi.fetchProducts();
                // res is now plain data: either { products: [...] } or [...]
                const data = (res as any)?.products ?? (Array.isArray(res) ? res : []);
                setProducts(data);
            } catch (err: any) {
                console.error('Failed to load products', err);
                if (err.name === 'ApiEnvelopeError' && err.code === 'NOT_FOUND') {
                    setProducts([]);
                } else {
                    setError(err.message || 'Failed to initialize terminal.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!studentId) {
            toast.error(t('auto_286'));
            return;
        }
        if (cart.length === 0) return;

        setProcessing(true);
        try {
            await posApi.createOrder(studentId, cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            })));
            setCart([]);
            setStudentId('');
            toast.success(t('auto_268'));
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];
    const filteredProducts = activeCategory === 'ALL'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 p-2">
            {/* Left: Product Grid */}
            <div className="w-2/3 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800">{t('auto_066')}</h1>
                        <p className="text-gray-500 font-medium">{t('auto_342')}</p>
                    </div>
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1">
                        <CardsSkeleton count={6} />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
                        <span className="text-2xl">{t('auto_436')}</span>
                        <span className="font-bold">{error}</span>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="glass-card text-center py-20 rounded-3xl mx-auto w-full border-2 border-dashed border-indigo-100 bg-white/50 backdrop-blur-sm">
                        <div className="text-6xl mb-6">🛒</div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">{t('auto_230')}</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto">
                            {t('auto_374')}
                                                            </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left"
                            >
                                <div className="h-32 w-full bg-gray-50 rounded-2xl mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                                    {product.image || '🍔'}
                                </div>
                                <h3 className="font-bold text-gray-800">{product.name}</h3>
                                <p className="text-indigo-600 font-black">${product.price.toFixed(2)}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-1/3 bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden border border-gray-100">
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <h2 className="text-xl font-black text-gray-800">{t('auto_099')}</h2>
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('auto_356')}</label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder={t('auto_317')}
                            className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-xl px-4 py-3 font-mono font-bold text-lg outline-none transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <span className="text-6xl mb-2">🛒</span>
                            <p className="font-bold">{t('auto_068')}</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                                        {item.product.image || '🍔'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{item.product.name}</p>
                                        <p className="text-xs text-gray-500">${item.product.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white rounded-lg shadow-sm">
                                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors font-bold">-</button>
                                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-500 transition-colors font-bold">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-bold">{t('auto_381')}</span>
                        <span className="text-3xl font-black text-gray-800">${total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={processing || cart.length === 0 || !studentId}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                {t('auto_296')}
                                                            </>
                        ) : (
                            <>
                                <span>💳</span> {t('auto_294')}
                                                                </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
