"use client";

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    totalItems: number;
}

export const SearchBar = ({ searchTerm, onSearchChange, totalItems }: SearchBarProps) => {
    return (
        <div className="bg-[#1e293b]/50 border border-[#334155] p-4 rounded-2xl flex items-center gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Gmail jobs..."
                    className="w-full pl-10 pr-10 py-2 bg-transparent border border-[#334155] rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchTerm && (
                    <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        <X size={16} />
                    </button>
                )}
            </div>
            <div className="text-sm text-gray-400">
                {totalItems} Jobs
            </div>
        </div>
    );
};
