import React from 'react';

type ResponsiveTableProps = {
    children: React.ReactNode;
    className?: string;
};

/**
 * Wraps native HTML <table> elements to ensure they scroll horizontally
 * on small mobile devices (e.g. 360px portrait) instead of breaking the viewport width.
 */
export default function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
    return (
        <div className={`w-full overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white ${className}`}>
            {children}
        </div>
    );
}
