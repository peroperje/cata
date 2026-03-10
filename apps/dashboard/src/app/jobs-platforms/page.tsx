"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ExternalLink, GripVertical, Plus, Trash2, Edit2 } from 'lucide-react';
import { Modal, ConfirmModal } from '@cata/shared-ui';

interface JobPlatform {
    id: number;
    name: string;
    url: string;
    description: string;
    position: number;
}

export default function JobsPlatformsPage() {
    const [platforms, setPlatforms] = useState<JobPlatform[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<JobPlatform | null>(null);
    const [formData, setFormData] = useState({ name: '', url: '', description: '' });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const fetchPlatforms = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/platforms`);
            if (res.ok) {
                const data = await res.json();
                setPlatforms(data);
            }
        } catch (error) {
            console.error('Failed to fetch platforms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlatforms();
    }, []);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newPlatforms = Array.from(platforms);
        const [reorderedItem] = newPlatforms.splice(sourceIndex, 1);
        newPlatforms.splice(destinationIndex, 0, reorderedItem);

        // Update positions locally
        const updatedPlatforms = newPlatforms.map((item, index) => ({
            ...item,
            position: index + 1
        }));

        setPlatforms(updatedPlatforms);

        // Sync with backend
        try {
            const payload = updatedPlatforms.map(p => ({
                id: p.id,
                position: p.position
            }));
            await fetch(`${API_BASE_URL}/platforms/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Failed to sync reorder:', error);
            fetchPlatforms();
        }
    };

    const handleOpenAddModal = () => {
        setSelectedPlatform(null);
        setFormData({ name: '', url: '', description: '' });
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (platform: JobPlatform) => {
        setSelectedPlatform(platform);
        setFormData({ name: platform.name, url: platform.url, description: platform.description || '' });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (platform: JobPlatform) => {
        setSelectedPlatform(platform);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = selectedPlatform ? 'PUT' : 'POST';
        const url = selectedPlatform 
            ? `${API_BASE_URL}/platforms/${selectedPlatform.id}` 
            : `${API_BASE_URL}/platforms`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    position: selectedPlatform ? selectedPlatform.position : platforms.length + 1
                })
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchPlatforms();
            }
        } catch (error) {
            console.error('Failed to save platform:', error);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPlatform) return;
        try {
            const res = await fetch(`${API_BASE_URL}/platforms/${selectedPlatform.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setIsDeleteModalOpen(false);
                fetchPlatforms();
            }
        } catch (error) {
            console.error('Failed to delete platform:', error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white font-outfit">Jobs Platforms</h1>
                    <p className="text-slate-400 mt-2">Manage and reorder your preferred job platforms.</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    <span className="font-medium">Add Platform</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="platforms-list">
                        {(provided) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {platforms.map((platform, index) => (
                                    <Draggable key={platform.id.toString()} draggableId={platform.id.toString()} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`bg-[#1e293b] border border-[#334155] p-4 rounded-xl flex items-center gap-4 transition-all group ${
                                                    snapshot.isDragging ? 'shadow-2xl shadow-indigo-500/40 scale-[1.02] border-indigo-500 bg-[#0f172a]' : 'hover:border-slate-500'
                                                }`}
                                            >
                                                <div 
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <GripVertical size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-bold text-white font-outfit">
                                                           {index + 1}{'. '}{platform.name}
                                                        </h3>
                                                        <a 
                                                            href={platform.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 hover:bg-indigo-500/10 rounded-lg"
                                                            title={`Visit ${platform.name}`}
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </div>
                                                    {platform.description && (
                                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                            {platform.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenEditModal(platform)}
                                                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                                                        title="Edit Platform"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(platform)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                                        title="Delete Platform"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                {platforms.length === 0 && (
                                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-[#334155] rounded-xl font-medium">
                                        No platforms found. Start by adding one!
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={selectedPlatform ? "Edit Platform" : "Add New Platform"}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            form="platform-form"
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20 font-bold active:scale-95"
                        >
                            {selectedPlatform ? "Update" : "Create"}
                        </button>
                    </div>
                }
            >
                <form id="platform-form" onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Platform Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Otta"
                            className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder:text-slate-600"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Website URL</label>
                        <input
                            required
                            type="url"
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder:text-slate-600"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Briefly describe what this platform is best for..."
                            className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all resize-none placeholder:text-slate-600"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Platform"
                message={`Are you sure you want to remove "${selectedPlatform?.name}"? This action cannot be undone.`}
                type="danger"
            />
        </div>
    );
}
