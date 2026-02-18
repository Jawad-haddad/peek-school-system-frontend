'use client';

import { useState } from 'react';
import { BusTrip, BusTripEntry, BusTripEntryStatus } from '@/lib/types/bus';
import { User, CheckCircle, MapPin, XCircle, LogOut, Navigation, Bus, Clock, Loader2, AlertCircle } from 'lucide-react';
import { busApi } from '@/lib/api';

interface BusTripViewProps {
    trip: BusTrip;
    onBack: () => void;
}

export default function BusTripView({ trip: initialTrip, onBack }: BusTripViewProps) {
    const [trip, setTrip] = useState<BusTrip>(initialTrip);
    const [isMutating, setIsMutating] = useState(false); // Global mutation lock
    const [tripLoading, setTripLoading] = useState(false); // For trip start/end actions
    const [refreshError, setRefreshError] = useState(false);

    // Helper to refresh trip data from server
    const refreshTrip = async () => {
        try {
            setRefreshError(false);
            const response = await busApi.getTrip(trip.id);
            setTrip(response.data);
        } catch (error) {
            console.error("Failed to refresh trip data", error);
            setRefreshError(true);
        }
    };

    const handleStatusChange = async (entryId: string, studentId: string, newStatus: BusTripEntryStatus) => {
        if (isMutating) return;
        setIsMutating(true);

        try {
            if (newStatus === 'WAITING') return;

            // 1. Call API
            await busApi.scanStudent(trip.id, studentId, newStatus as 'BOARDED' | 'DROPPED_OFF' | 'ABSENT');

            // 2. Refresh Data (Source of Truth)
            await refreshTrip();

        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update student status. Please try again.");
        } finally {
            setIsMutating(false);
        }
    };

    const nextStatusMap: Record<BusTripEntryStatus, BusTripEntryStatus> = {
        'WAITING': 'BOARDED',
        'BOARDED': 'DROPPED_OFF',
        'DROPPED_OFF': 'WAITING', // loop back enabled for corrections
        'ABSENT': 'WAITING'
    };

    const getStatusColor = (status: BusTripEntryStatus) => {
        switch (status) {
            case 'BOARDED': return 'bg-green-100 text-green-800 border-green-200';
            case 'DROPPED_OFF': return 'bg-blue-100 text-blue-900 border-blue-200 cursor-not-allowed';
            case 'ABSENT': return 'bg-red-50 text-red-500 border-red-100';
            case 'WAITING': return 'bg-gray-50 text-gray-400 border-gray-100 opacity-60';
            default: return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const getStatusIcon = (status: BusTripEntryStatus) => {
        switch (status) {
            case 'BOARDED': return <Bus size={20} />;
            case 'DROPPED_OFF': return <MapPin size={20} />;
            case 'ABSENT': return <XCircle size={20} />;
            default: return <Clock size={20} />;
        }
    };

    const handleStartTrip = async () => {
        if (isMutating || tripLoading) return;
        setTripLoading(true);
        try {
            await busApi.startTrip(trip.id);
            // Refresh logic could be here, or we trust the state change enough to just re-fetch
            const response = await busApi.getTrip(trip.id);
            setTrip(response.data);
        } catch (error) {
            console.error("Start Trip Failed", error);
            alert("Failed to start trip.");
        } finally {
            setTripLoading(false);
        }
    };

    const handleEndTrip = async () => {
        if (isMutating || tripLoading) return;
        setTripLoading(true);
        try {
            await busApi.endTrip(trip.id);
            // Verify completion or just go back
            onBack();
        } catch (error) {
            console.error("End Trip Failed", error);
            alert("Failed to end trip.");
        } finally {
            setTripLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header Controls */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-800">
                        &larr; Routes
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${trip.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                            {trip.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    {trip.status === 'SCHEDULED' && (
                        <button
                            onClick={handleStartTrip}
                            disabled={tripLoading || isMutating}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {tripLoading ? <Loader2 className="animate-spin" /> : <Navigation size={18} />}
                            Start Trip
                        </button>
                    )}
                    {trip.status === 'IN_PROGRESS' && (
                        <button
                            onClick={handleEndTrip}
                            disabled={tripLoading || isMutating}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {tripLoading ? <Loader2 className="animate-spin" /> : <LogOut size={18} />}
                            End Trip
                        </button>
                    )}
                </div>
            </div>

            {/* Student List */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 pb-24 ${isMutating ? 'pointer-events-none opacity-80' : ''}`}>
                {refreshError && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center mb-4 animate-in slide-in-from-top-4 fade-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="font-bold text-red-800 mb-1">Connection Lost</h3>
                        <p className="text-sm text-red-600 mb-4">Could not sync with the server.</p>
                        <button
                            onClick={refreshTrip}
                            className="bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}

                {trip.entries.map((entry) => (
                    <div key={entry.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-opacity ${entry.status === 'WAITING' ? 'opacity-80' : 'opacity-100'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg border-2 border-white shadow-sm overflow-hidden">
                                {entry.studentPhotoUrl ? (
                                    <img src={entry.studentPhotoUrl} alt={entry.studentName} className="w-full h-full object-cover" />
                                ) : (
                                    entry.studentName.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 className={`text-gray-800 ${entry.status === 'BOARDED' ? 'font-black text-green-800' : 'font-bold'}`}>
                                    {entry.studentName}
                                </h3>
                                <p className="text-xs text-gray-400 font-mono">ID: {entry.studentId.slice(0, 6)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Absent Button (Only show if waiting) */}
                            {entry.status === 'WAITING' && (
                                <button
                                    onClick={() => handleStatusChange(entry.id, entry.studentId, 'ABSENT')}
                                    disabled={isMutating}
                                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105 active:scale-95 transition-all border border-red-100"
                                    aria-label="Mark Absent"
                                >
                                    <XCircle size={24} />
                                </button>
                            )}

                            {/* Main Action Toggle */}
                            <button
                                onClick={() => entry.status !== 'DROPPED_OFF' && handleStatusChange(entry.id, entry.studentId, nextStatusMap[entry.status])}
                                disabled={entry.status === 'DROPPED_OFF' || isMutating}
                                className={`
                                    p-3 px-5 rounded-xl border flex items-center justify-center gap-2 font-bold shadow-sm transition-all active:scale-95
                                    ${getStatusColor(entry.status)}
                                    ${entry.status === 'ABSENT' ? 'opacity-50 grayscale' : ''}
                                `}
                            >
                                {isMutating && entry.status !== 'DROPPED_OFF' ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    getStatusIcon(entry.status)
                                )}
                                <span className="hidden sm:inline text-xs uppercase tracking-wider">
                                    {entry.status === 'BOARDED' ? 'DROP OFF' : entry.status.replace('_', ' ')}
                                </span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 flex justify-around text-center text-xs font-bold text-gray-400 uppercase tracking-wider z-10">
                <div>
                    <span className="block text-xl text-gray-800 font-black">{trip.entries.length}</span>
                    Total
                </div>
                <div>
                    <span className="block text-xl text-green-600 font-black">{trip.entries.filter(e => e.status === 'BOARDED').length}</span>
                    On Bus
                </div>
                <div>
                    <span className="block text-xl text-blue-600 font-black">{trip.entries.filter(e => e.status === 'DROPPED_OFF').length}</span>
                    Dropped
                </div>
            </div>
        </div>
    );
}
