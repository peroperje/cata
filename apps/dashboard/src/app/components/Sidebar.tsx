"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@cata/shared-types';
import { Briefcase, Database, Mail, LayoutDashboard, Settings, Globe } from 'lucide-react';

const navItems = [
    { name: 'Job Tracker', href: '/tracker', icon: Briefcase },
    { name: 'Scraped Jobs', href: '/scraped', icon: Database },
    { name: 'Gmail Jobs', href: '/gmail-jobs', icon: Mail },
    { name: 'Jobs Platforms', href: '/jobs-platforms', icon: Globe },
];

export const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 border-r border-slate-800 flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <LayoutDashboard size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight">CATA Dashboard</span>
                        <span className="text-xs text-slate-500 font-medium">v{APP_VERSION}</span>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-slate-800">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors"
                >
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </Link>
            </div>
        </aside>
    );
};
