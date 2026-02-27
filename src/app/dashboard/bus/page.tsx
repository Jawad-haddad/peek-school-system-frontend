'use client';

import { useState, useEffect } from 'react';
import { Bus, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { BusTrip, BusRoute } from '@/lib/types/bus';
import BusTripView from '@/components/dashboard/BusTripView';
import { busApi } from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { permissions } from '@/lib/permissions';

export default function BusDashboardPage() {
    const [selectedTrip, setSelectedTrip] = useState<BusTrip | null>(null);
    const [routes, setRoutes] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                setError(null);
                const response = await busApi.getRoutes();
                setRoutes(response.data);
            } catch (error) {
                console.error("Failed to fetch routes", error);
                setError("No assigned routes found or server error.");
            } finally {
                setLoading(false);
            }
        };
        fetchRoutes();
    }, []);

    const handleRouteClick = async (routeId: string) => {
        setLoading(true);
        try {
            // We fetch the active trip for the selected route
            const response = await busApi.getActiveTripForRoute(routeId);
            setSelectedTrip(response.data);
        } catch (error) {
            console.error("Failed to fetch active trip for route", error);
            // Optional: Show a toast or specific error for this action
            alert("Could not load active trip for this route.");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (selectedTrip) {
            return (
                <BusTripView
                    trip={selectedTrip}
                    onBack={() => {
                        setSelectedTrip(null);
                        setLoading(false); // Ensure loading is off when returning
                    }}
                />
            );
        }

        if (loading && routes.length === 0) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 text-violet-600">
                    <Loader2 className="animate-spin" size={48} />
                </div>
            );
        }

        if (error) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-4 p-4 text-center">
                    <AlertCircle size={48} className="text-red-400" />
                    <p className="text-lg font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 pb-12 text-white shadow-lg rounded-b-[2.5rem]">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Bus size={24} />
                        <span className="text-sm font-bold uppercase tracking-widest">Bus Supervisor</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Assigned Routes</h1>
                    <p className="opacity-75 mt-1">Select a route to start the trip.</p>
                </div>

                {/* Route List */}
                <div className="p-4 -mt-8 space-y-4">
                    {routes.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center text-gray-400 border border-gray-100 shadow-lg">
                            <p>No routes assigned to you.</p>
                        </div>
                    ) : (
                        routes.map((route) => (
                            <div
                                key={route.id}
                                onClick={() => handleRouteClick(route.id)}
                                className={`
                                    group bg-white p-5 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden transition-all active:scale-95 cursor-pointer hover:border-violet-200
                                `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-violet-600 transition-colors">{route.name}</h3>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-1 font-medium">
                                            <Bus size={12} />
                                            {route.vehiclePlate}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-xl text-gray-800 font-bold text-sm border border-gray-100 shadow-sm group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                                        {route.time || 'N/A'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            View Active Trip
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <ProtectedRoute allowed={permissions.canManageBus}>
            {renderContent()}
        </ProtectedRoute>
    );
}
