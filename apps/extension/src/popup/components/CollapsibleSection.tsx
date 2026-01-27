import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    isExpanded,
    onToggle,
    children
}) => {
    return (
        <>
            <h2 className="collapsible-header" onClick={onToggle}>
                <span>{title}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </h2>
            <div className={`collapsible-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {children}
            </div>
        </>
    );
};
