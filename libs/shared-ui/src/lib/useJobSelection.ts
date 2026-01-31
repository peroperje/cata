import { useState } from 'react';

export const useJobSelection = () => {
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

    const handleSelectJob = (id: number) => {
        setSelectedJobId(prevId => prevId === id ? null : id);
    };

    return {
        selectedJobId,
        handleSelectJob,
        setSelectedJobId
    };
};
