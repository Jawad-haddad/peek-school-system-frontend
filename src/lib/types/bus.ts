export type BusRoute = {
    id: string;
    name: string;
    description?: string;
    driverName?: string;
    vehiclePlate?: string;
    time?: string; // e.g. "07:30 AM"
};

export type BusTripEntryStatus = 'WAITING' | 'BOARDED' | 'DROPPED_OFF' | 'ABSENT';

export type BusTripEntry = {
    id: string;
    studentId: string;
    studentName: string;
    studentPhotoUrl?: string; // Optional, use placeholder if missing
    status: BusTripEntryStatus;
    checkInTime?: string; // ISO timestamp
    checkOutTime?: string; // ISO timestamp
};

export type BusTrip = {
    id: string;
    routeId: string;
    date: string; // ISO date
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    entries: BusTripEntry[];
};
