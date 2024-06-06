import React from 'react';
import { container, circleOuter } from './Loader.module.css';

const Loader = () => {
    return (
        <div className={container}>
            <div className={circleOuter}>
            </div>
        </div>
    );
};

export { Loader };