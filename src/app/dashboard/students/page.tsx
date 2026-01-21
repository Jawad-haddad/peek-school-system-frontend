// src/app/dashboard/students/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

type Class = {
  id: string;
  name: string;
};

export default function SelectClassPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        const response = await axios.get('http://localhost:3000/api/schools/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(response.data);
      } catch (error) {
        console.error("Failed to fetch classes", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800">Select a Class</h1>
      <p className="mt-2 text-gray-600">Choose a class to manage its students.</p>

      {loading ? (
        <p className="mt-8">Loading classes...</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/students/${c.id}`}
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