import { useMemo } from 'react';
import styles from './DualLineChart.module.css';

export default function DualLineChart({
    data1, // Ventas (eje izquierdo)
    data2, // Visitas (eje derecho)
    labels,
    color1 = '#00bfff',
    color2 = '#a78bfa',
    height = 200,
    width = '100%'
}) {
    const points1 = useMemo(() => {
        if (!data1 || data1.length === 0) return "";
        const max = Math.max(...data1) || 1;
        const min = 0; // Siempre desde 0 para ventas
        const range = max - min;

        // Normalizar 0-100
        const normalized = data1.map(val => ((val - min) / range) * 80 + 10);
        const stepX = 100 / (Math.max(data1.length - 1, 1));

        return normalized.map((val, index) => {
            const x = index * stepX;
            const y = 100 - val;
            return `${x},${y}`;
        }).join(" ");
    }, [data1]);

    const points2 = useMemo(() => {
        if (!data2 || data2.length === 0) return "";
        const max = Math.max(...data2) || 1;
        const min = 0;
        const range = max - min;

        // Normalizar 0-100
        const normalized = data2.map(val => ((val - min) / range) * 80 + 10);
        const stepX = 100 / (Math.max(data2.length - 1, 1));

        return normalized.map((val, index) => {
            const x = index * stepX;
            const y = 100 - val;
            return `${x},${y}`;
        }).join(" ");
    }, [data2]);

    if ((!data1 || data1.length === 0) && (!data2 || data2.length === 0)) {
        return (
            <div className={styles.noData} style={{ width, height }}>
                Sin datos para este periodo
            </div>
        );
    }

    return (
        <div className={styles.chartContainer} style={{ width }}>
            <svg viewBox="0 0 100 100" width="100%" height={height} preserveAspectRatio="none" className={styles.svg}>
                {/* Línea 1: Ventas */}
                <polyline
                    fill="none"
                    stroke={color1}
                    strokeWidth="2"
                    points={points1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Línea 2: Visitas */}
                <polyline
                    fill="none"
                    stroke={color2}
                    strokeWidth="2"
                    points={points2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="4" // Punteada para diferenciar
                />
            </svg>

            {labels && labels.length > 0 && (
                <div className={styles.labelsContainer}>
                    {labels.map((label, index) => {
                        const totalLabels = labels.length;
                        const step = Math.ceil(totalLabels / 5);
                        const shouldShow = index === 0 || index === totalLabels - 1 || index % step === 0;

                        if (shouldShow) {
                            const simpleDate = label.includes('-') ? label.split('-').slice(1).reverse().join('/') : label;
                            return (
                                <span key={index} className={styles.label}>
                                    {simpleDate}
                                </span>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
}