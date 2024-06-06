import { useState, useEffect } from 'react';

function useResponsiveValue(mobileValue, tabletValue, desktopValue) {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 767;
    const isTablet = windowWidth >= 768 && windowWidth <= 1199;

    if (isMobile) {
        return mobileValue;
    } else if (isTablet) {
        return tabletValue;
    } else {
        return desktopValue;
    };
};

export default useResponsiveValue;