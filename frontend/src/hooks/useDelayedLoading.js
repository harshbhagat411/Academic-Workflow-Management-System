import { useState, useEffect } from 'react';

export const useDelayedLoading = (loading, delay = 300) => {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        let timeout;
        if (loading) {
            timeout = setTimeout(() => {
                setShowLoading(true);
            }, delay);
        } else {
            setShowLoading(false);
        }

        return () => clearTimeout(timeout);
    }, [loading, delay]);

    return showLoading;
};
