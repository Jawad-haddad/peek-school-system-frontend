// src/app/dashboard/timetable/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { academicApi } from '@/lib/api';
import Link from 'next/link';

type Class = {
    id: string;
    name: string;
};

// This page is a simple class selector
export default function SelectTimetablePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await academicApi.fetchClasses();
                const data = Array.isArray(response.data)
                    ? response.data
                    : (response.data.classes || response.data.data || []);
                setClasses(data);
            } catch (error) {
                // Classes list will remain empty
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">Manage Timetables</h1>
            <p className="mt-2 text-gray-600">Please select a class to view or edit its weekly timetable.</p>

            {loading ? (
                <p className="mt-8">Loading classes...</p>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {classes.map((c) => (
                        <Link
                            key={c.id}
                            // This link points to the dynamic [classId] page
                            href={`/dashboard/timetable/${c.id}`}
                            className="transform rounded-lg bg-white p-6 text-center shadow transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <h2 className="text-xl font-semibold text-gray-900">{c.name}</h2>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}