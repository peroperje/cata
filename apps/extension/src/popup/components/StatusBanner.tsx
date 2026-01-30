import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface StatusBannerProps {
    status: {
        type: 'idle' | 'loading' | 'success' | 'error';
        message: string;
        errorType?: string;
    };
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ status }) => {
    if (!status.message) return null;

    return (
        <div className={`status ${status.type}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            marginBottom: '1rem'
        }}>
            {status.type === 'success' && <CheckCircle size={14} color="#10b981" />}
            {status.type === 'error' && <AlertCircle size={14} color="#ef4444" />}
            {status.type === 'loading' && (
                <div className="spinner" style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid var(--text-muted)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            )}
            <span style={{ fontWeight: 500 }}>{status.message}</span>
        </div>
    );
};
