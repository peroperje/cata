import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const footer = (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
            <button
                className="button"
                style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    flex: 1
                }}
                onClick={onClose}
            >
                {cancelText}
            </button>
            <button
                className="button"
                style={{
                    backgroundColor: type === 'danger' ? '#ef4444' : 'var(--primary)',
                    flex: 1
                }}
                onClick={handleConfirm}
            >
                {confirmText}
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                {type === 'danger' && (
                    <div style={{ color: '#ef4444', backgroundColor: '#ef444420', padding: '0.75rem', borderRadius: '50%' }}>
                        <AlertTriangle size={32} />
                    </div>
                )}
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>
                    {message}
                </p>
            </div>
        </Modal>
    );
};
