"use client";

import React, { useState } from 'react';
import { Settings, Plus, Trash2, ChevronDown, ChevronUp, ToggleRight, ToggleLeft } from 'lucide-react';
import { GmailFilter } from '@cata/shared-types';

interface SenderFiltersProps {
    filters: GmailFilter[];
    onAddFilter: (email: string) => Promise<void>;
    onDeleteFilter: (id: number) => Promise<void>;
    onToggleFilter: (id: number) => Promise<void>;
}

export const SenderFilters = ({ filters, onAddFilter, onDeleteFilter, onToggleFilter }: SenderFiltersProps) => {
    const [newFilter, setNewFilter] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAdd = async () => {
        if (!newFilter) return;
        await onAddFilter(newFilter);
        setNewFilter('');
    };

    return (
        <div className="border border-[#334155] rounded-2xl p-6 bg-[#1e293b]/50 h-full">
            <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings size={20} className="text-indigo-400" />
                    Sender Filters
                    <span className="text-xs font-normal text-gray-400 ml-2 bg-[#0f172a] px-2 py-0.5 rounded-full border border-[#334155]">
                        {filters.length}
                    </span>
                </h2>
                <div className="p-1 hover:bg-[#334155] rounded-lg transition-colors">
                    {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400 group-hover:text-white" />
                    ) : (
                        <ChevronDown size={20} className="text-gray-400 group-hover:text-white" />
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="email@example.com"
                            value={newFilter}
                            onChange={(e) => setNewFilter(e.target.value)}
                            className="flex-1 bg-transparent border border-[#334155] rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <button 
                            onClick={handleAdd}
                            className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {filters.map(filter => (
                            <div key={filter.id} className={`flex justify-between items-center p-2 rounded-lg border border-[#334155] text-sm transition ${filter.is_active ? 'bg-[#1e293b]' : 'bg-[#0f172a] opacity-50'}`}>
                                <span className={`truncate ${filter.is_active ? 'text-white' : 'text-gray-500 line-through'}`}>{filter.email_sender}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onToggleFilter(filter.id)}
                                        className={filter.is_active ? "text-indigo-400 hover:text-indigo-300 transition" : "text-gray-500 hover:text-gray-400 transition"}
                                        title={filter.is_active ? "Deactivate filter" : "Activate filter"}
                                    >
                                        {filter.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => onDeleteFilter(filter.id)}
                                        className="text-gray-500 hover:text-red-400 transition"
                                        title="Delete filter"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filters.length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-500 italic">
                                No filters added yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
