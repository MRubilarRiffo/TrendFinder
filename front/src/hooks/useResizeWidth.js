import { useEffect, useState } from "react";

function useResizeWidth(containerRef) {
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const newWidth = containerRef.current.getBoundingClientRect().width;
                setContainerWidth(newWidth);
            };
        };
    
        window.addEventListener('resize', handleResize);
    
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return containerWidth;
};

export default useResizeWidth;