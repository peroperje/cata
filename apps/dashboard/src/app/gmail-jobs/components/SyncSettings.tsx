"use client";

import React from 'react';
import { GmailSettings } from '@cata/shared-types';
import { cn } from '../../../lib/utils';

interface SyncSettingsProps {
    settings: GmailSettings | null;
    onUpdateSettings: (updates: Partial<GmailSettings>) => Promise<void>;
}

export const SyncSettings = ({ settings, onUpdateSettings }: SyncSettingsProps) => {
    if (!settings) return null;

    return (
        <div className="flex items-center gap-4 bg-[#1e293b] border border-[#334155] p-2 px-4 rounded-xl">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sync is</span>
                <button 
                    onClick={() => onUpdateSettings({ is_active: !settings.is_active })}
                    className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold uppercase transition",
                        settings.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}
                >
                    {settings.is_active ? "Active" : "Inactive"}
                </button>
            </div>
            <div className="w-px h-4 bg-[#334155]" />
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Interval</span>
                <select 
                    value={settings.fetch_interval_minutes}
                    onChange={(e) => onUpdateSettings({ fetch_interval_minutes: parseInt(e.target.value) })}
                    className="bg-transparent border-none text-sm text-indigo-400 font-bold focus:ring-0 cursor-pointer"
                >
                    <option value={15}>15m</option>
                    <option value={30}>30m</option>
                    <option value={60}>1h</option>
                    <option value={1440}>24h</option>
                </select>
            </div>
        </div>
    );
};
