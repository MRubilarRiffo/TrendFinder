import styles from './SimpleLineChart.module.css';
import { useMemo, useState, memo } from 'react';

const SimpleLineChart = ({ data, labels, color = '#00bfff', height = 100, width = '100%' }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const points = useMemo(() => {
        if (!data || data.length === 0) return '';

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        // Normalize data to 0-100 range for Y axis
        // We leave some padding at top and bottom
        const normalizedData = data.map(val => ((val - min) / range) * 80 + 10);

        const stepX = 100 / (Math.max(data.length - 1, 1));

        return normalizedData.map((val, index) => {
            const x = index * stepX;
            const y = 100 - val; // SVG Y coordinates are inverted
            return `${x},${y}`;
        }).join(' ');
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className={styles.noData} style={{ width, height }}>
                Sin datos para este periodo
            </div>
        );
    }

    const stepX = data && data.length > 1 ? 100 / (data.length - 1) : 100;

    return (
        <div className={styles.chartContainer} style={{ width }}>
            <svg width='100%' height={height} style={{ overflow: 'visible' }}>
                <svg viewBox='0 0 100 100' width='100%' height={height} preserveAspectRatio='none' style={{ overflow: 'visible' }}>
                    <polyline
                        fill='none'
                        stroke={color}
                        strokeWidth='1'
                        points={points}
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        vectorEffect='non-scaling-stroke'
                    />
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1='0' x2='0' y1='0' y2='1'>
                            <stop offset='0%' stopColor={color} stopOpacity='0.2' />
                            <stop offset='100%' stopColor={color} stopOpacity='0' />
                        </linearGradient>
                    </defs>
                    <polygon
                        fill={`url(#gradient-${color})`}
                        points={`0,100 ${points} 100,100`}
                    />
                </svg>
                {points.split(' ').map((point, index) => {
                    const [x, y] = point.split(',');
                    const isHovered = hoveredIndex === index;

                    const startX = Math.max(0, parseFloat(x) - stepX / 2);
                    const endX = Math.min(100, parseFloat(x) + stepX / 2);
                    const rectWidth = endX - startX;

                    return (
                        <g key={index}>
                            {/* El área de captura invisible (Rectángulo) */}
                            <rect
                                x={`${startX}%`} // Centramos el rectángulo en el punto X
                                y='0'
                                width={`${rectWidth}%`} // El ancho es la distancia hasta el siguiente punto
                                height='100%' // Ocupa todo el alto del gráfico
                                fill='transparent' // Lo hacemos invisible
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />

                            {isHovered && (
                                <line
                                    x1={`${x}%`}
                                    y1='0'       /* Empieza desde arriba del todo */
                                    x2={`${x}%`}
                                    y2='100%'    /* Termina abajo del todo */
                                    stroke='#ffffff' /* Puedes usar un gris como '#cccccc' si prefieres */
                                    strokeWidth='1'
                                    strokeDasharray='4 4' /* Crea el efecto de línea punteada */
                                    pointerEvents='none'  /* Para no interferir con el hover del rect */
                                />
                            )}

                            <text
                                x={`${x}%`}
                                y={`${y}%`}
                                dy='-15' /* Desplaza el texto 15px hacia arriba para que no tape el círculo */
                                textAnchor='middle' /* Centra el texto horizontalmente sobre el punto */
                                fill='#ffffff' /* Color del texto (blanco resalta bien en fondos oscuros) */
                                fontSize='12px'
                                fontWeight='bold'
                                pointerEvents='none' /* Para no bloquear el hover */
                            >
                                {data[index]}
                            </text>

                            {/* El Círculo visible */}
                            <circle
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r='3' /* Crece si su rectángulo está hovered */
                                fill={color}
                                stroke={isHovered ? '#ffffff' : 'none'}
                                strokeWidth={isHovered ? '1' : '0'} /* Borde más grueso si está hovered */
                                pointerEvents='none' /* Clave: Evita que el círculo interfiera con el mouse del rectángulo */
                            />
                        </g>
                    )
                })}
            </svg>

            {labels && labels.length > 0 && (
                <div className={styles.labelsContainer}>
                    {labels.map((label, index) => {
                        // Show max 6 labels logically distributed
                        const totalLabels = labels.length;
                        const step = Math.ceil(totalLabels / 5);

                        // Always show first and last
                        // Show others based on step
                        const shouldShow = index === 0 || index === totalLabels - 1 || index % step === 0;

                        if (shouldShow) {
                            // Format date from YYYY-MM-DD to DD/MM
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

export default memo(SimpleLineChart);