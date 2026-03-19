'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { nfcApi, schoolApi, NfcCard, NfcDevice, AssignCardPayload, StudentRecord } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type FilterStatus = 'ALL' | 'ACTIVE' | 'BLOCKED';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status, text }: { status: 'ACTIVE' | 'BLOCKED' | 'DISABLED'; text?: string }) {
    const isActive = status === 'ACTIVE';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isActive
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {text || (isActive ? 'Active' : 'Blocked')}
        </span>
    );
}

function Spinner({ small }: { small?: boolean }) {
    return (
        <div
            className={`animate-spin rounded-full border-2 border-white/30 border-t-white ${
                small ? 'h-4 w-4' : 'h-5 w-5'
            }`}
        />
    );
}

// ── Cards View ─────────────────────────────────────────────────────────────────

function CardsView() {
    const [uid, setUid] = useState('');
    const [studentId, setStudentId] = useState('');
    const [label, setLabel] = useState('');
    const [assigning, setAssigning] = useState(false);

    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    const [cards, setCards] = useState<NfcCard[]>([]);
    const [loadingCards, setLoadingCards] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [unassignConfirmId, setUnassignConfirmId] = useState<string | null>(null);

    const [filterUid, setFilterUid] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

    const uidInputRef = useRef<HTMLInputElement>(null);

    const loadCards = useCallback(async () => {
        setLoadingCards(true);
        try {
            const data = await nfcApi.getCards();
            setCards(Array.isArray(data) ? data : []);
        } catch {} finally {
            setLoadingCards(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const data = await schoolApi.fetchAllStudents();
                setStudents(Array.isArray(data) ? data : []);
            } catch {} finally {
                setLoadingStudents(false);
            }
        })();
        loadCards();
    }, [loadCards]);

    useEffect(() => {
        uidInputRef.current?.focus();
    }, []);

    const handleAssign = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!uid.trim() || !studentId) return;

        setAssigning(true);
        try {
            const payload: AssignCardPayload = {
                uid: uid.trim().toUpperCase(),
                studentId,
                ...(label.trim() ? { label: label.trim() } : {}),
            };
            await nfcApi.assignCard(payload);
            setUid('');
            setLabel('');
            setStudentId('');
            await loadCards();
            uidInputRef.current?.focus();
        } catch (error) {
            // Error handled by nfcApi inside api.ts (toast + formatApiError)
        } finally {
            setAssigning(false);
        }
    };

    const handleBlock = async (card: NfcCard) => {
        setActionLoadingId(card.id);
        try { await nfcApi.blockCard(card.id); await loadCards(); } catch {} finally { setActionLoadingId(null); }
    };

    const handleUnblock = async (card: NfcCard) => {
        setActionLoadingId(card.id);
        try { await nfcApi.unblockCard(card.id); await loadCards(); } catch {} finally { setActionLoadingId(null); }
    };

    const handleUnassign = async (card: NfcCard) => {
        if (unassignConfirmId !== card.id) {
            setUnassignConfirmId(card.id);
            return;
        }
        setUnassignConfirmId(null);
        setActionLoadingId(card.id);
        try { await nfcApi.unassignCard(card.id); await loadCards(); } catch (error) {} finally { setActionLoadingId(null); }
    };

    const filtered = cards.filter((c) => {
        if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
        if (filterUid && !c.uid.toLowerCase().includes(filterUid.toLowerCase())) return false;
        if (filterName && !c.student?.fullName.toLowerCase().includes(filterName.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Assign Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-violet-100 text-violet-600 rounded-lg p-1.5 text-sm">🪪</span>
                    Assign New Card
                </h2>

                <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="xl:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                            Card UID <span className="ml-1 text-violet-500 font-normal normal-case">(scan or type)</span>
                        </label>
                        <input
                            ref={uidInputRef}
                            type="text"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (!studentId) document.getElementById('nfc-student-select')?.focus();
                                    else handleAssign();
                                }
                            }}
                            placeholder="e.g. A1B2C3D4"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-mono font-bold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none transition"
                            autoComplete="off"
                        />
                    </div>
                    <div className="xl:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Student</label>
                        <select
                            id="nfc-student-select"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            disabled={loadingStudents}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none transition disabled:opacity-60"
                        >
                            <option value="">{loadingStudents ? 'Loading students…' : '— Select a student —'}</option>
                            {students.map((s) => (<option key={s.id} value={s.id}>{s.fullName}</option>))}
                        </select>
                    </div>
                    <div className="xl:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                            Label <span className="font-normal normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Red card"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none transition"
                        />
                    </div>
                    <div className="xl:col-span-1 flex items-end">
                        <button
                            type="submit"
                            disabled={!uid.trim() || !studentId || assigning}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {assigning ? <><Spinner small /> Assigning…</> : <><span>📎</span> Assign Card</>}
                        </button>
                    </div>
                </form>
                <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                    <span>💡</span> Scan-ready: tap the UID field, swipe the card — UID pastes automatically. Press Enter to assign.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        value={filterUid}
                        onChange={(e) => setFilterUid(e.target.value)}
                        placeholder="Filter by UID…"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none transition w-44"
                    />
                    <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Filter by student name…"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none transition w-52"
                    />
                    <div className="flex gap-1.5">
                        {(['ALL', 'ACTIVE', 'BLOCKED'] as FilterStatus[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    filterStatus === s ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {s === 'ALL' ? '🔍 All' : s === 'ACTIVE' ? '🟢 Active' : '🔴 Blocked'}
                            </button>
                        ))}
                    </div>
                    <span className="ml-auto text-xs text-gray-400 font-medium">
                        {filtered.length} card{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Cards Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loadingCards ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                        <p className="text-sm text-gray-400">Loading NFC cards…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <span className="text-5xl">📡</span>
                        <h3 className="font-bold text-gray-700 text-lg mt-2">
                            {cards.length === 0 ? 'No cards assigned yet' : 'No cards match your filters'}
                        </h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">UID</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Class</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Label</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Last Scanned</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((card) => {
                                    const isLoading = actionLoadingId === card.id;
                                    const confirmingUnassign = unassignConfirmId === card.id;
                                    return (
                                        <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3"><span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-xs">{card.uid}</span></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">{card.student?.fullName?.charAt(0) ?? '?'}</div>
                                                    <span className="font-medium text-gray-800">{card.student?.fullName ?? <span className="text-gray-400 italic">Unknown</span>}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{card.student?.class?.name ?? <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3"><StatusBadge status={card.status} /></td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{card.label || <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(card.lastScannedAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {card.status === 'ACTIVE' ? (
                                                        <button onClick={() => handleBlock(card)} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50">
                                                            {isLoading ? <Spinner small /> : '🔒'} Block
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleUnblock(card)} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50">
                                                            {isLoading ? <Spinner small /> : '🔓'} Unblock
                                                        </button>
                                                    )}
                                                    {confirmingUnassign ? (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleUnassign(card)} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50">
                                                                {isLoading ? <Spinner small /> : '⚠️'} Confirm
                                                            </button>
                                                            <button onClick={() => setUnassignConfirmId(null)} className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-all">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleUnassign(card)} disabled={isLoading} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">🗑️ Unassign</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Devices View ───────────────────────────────────────────────────────────────

function DevicesView() {
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);

    const [devices, setDevices] = useState<NfcDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const loadDevices = useCallback(async () => {
        setLoading(true);
        try {
            const data = await nfcApi.getDevices();
            setDevices(Array.isArray(data) ? data : []);
        } catch {} finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        try {
            await nfcApi.createDevice(name.trim());
            setName('');
            await loadDevices();
        } catch {} finally {
            setCreating(false);
        }
    };

    const handleCopyToken = (token: string) => {
        navigator.clipboard.writeText(token).catch(() => {});
    };

    const handleToggleStatus = async (d: NfcDevice) => {
        setActionLoadingId(d.id);
        const nextStatus = d.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        try {
            await nfcApi.updateDeviceStatus(d.id, nextStatus);
            await loadDevices();
        } catch {} finally {
            setActionLoadingId(null);
        }
    };

    const handleDelete = async (d: NfcDevice) => {
        if (deleteConfirmId !== d.id) {
            setDeleteConfirmId(d.id);
            return;
        }
        setDeleteConfirmId(null);
        setActionLoadingId(d.id);
        try {
            await nfcApi.deleteDevice(d.id);
            await loadDevices();
        } catch {} finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Create Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 rounded-lg p-1.5 text-sm">📡</span>
                    Register Reader Device
                </h2>

                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                            Device Name (Location)
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Main Entrance Reader"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!name.trim() || creating}
                        className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                        {creating ? <><Spinner small /> Registering…</> : <>➕ Register Device</>}
                    </button>
                </form>
            </div>

            {/* Devices Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                        <p className="text-sm text-gray-400">Loading devices…</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <span className="text-5xl">🔌</span>
                        <h3 className="font-bold text-gray-700 text-lg mt-2">No reader devices</h3>
                        <p className="text-sm text-gray-400 max-w-xs text-center">
                            Register your first ESP32 reader above to get its API credentials.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Device ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">API Key</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Last Active</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {devices.map((device) => {
                                    const isLoading = actionLoadingId === device.id;
                                    const confirmingDelete = deleteConfirmId === device.id;

                                    return (
                                        <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-800">{device.name}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                    {device.deviceId}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded truncate max-w-[150px] inline-block">
                                                        {device.apiKey}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            handleCopyToken(device.apiKey);
                                                            const btn = document.getElementById(`copy-btn-${device.id}`);
                                                            if (btn) {
                                                                btn.innerHTML = '✅';
                                                                setTimeout(() => (btn.innerHTML = '📋'), 2000);
                                                            }
                                                        }}
                                                        id={`copy-btn-${device.id}`}
                                                        className="text-gray-400 hover:text-gray-700 transition"
                                                        title="Copy API key to clipboard"
                                                    >
                                                        📋
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={device.status}
                                                    text={device.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">
                                                {formatDate(device.lastActiveAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(device)}
                                                        disabled={isLoading}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                            device.status === 'ACTIVE'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {device.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                                    </button>
                                                    {confirmingDelete ? (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleDelete(device)} disabled={isLoading} className="px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold transition hover:bg-red-700">
                                                                Confirm Delete
                                                            </button>
                                                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-200">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleDelete(device)} disabled={isLoading} className="px-2 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition">
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page Layout ───────────────────────────────────────────────────────────

export default function NfcPage() {
    const [activeTab, setActiveTab] = useState<'cards' | 'devices'>('cards');

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-16 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        <span className="text-4xl">📡</span> NFC Management
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-xl">
                        Manage NFC cards assigned to students and the ESP32 reader devices used to scan them.
                    </p>
                </div>

                <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 self-start">
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'cards'
                                ? 'bg-white text-violet-700 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                        }`}
                    >
                        🪪 Cards
                    </button>
                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'devices'
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                        }`}
                    >
                        🔌 Reader Devices
                    </button>
                </div>
            </div>

            {activeTab === 'cards' ? <CardsView /> : <DevicesView />}
        </div>
    );
}
