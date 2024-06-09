import { useEffect, useRef, useState } from "react";
import { createChart } from 'lightweight-charts';
import useResizeWidth from "../../hooks/useResizeWidth";

const Chart = ({ data }) => {
    const chartContainerRef = useRef();

    const containerWidth = useResizeWidth(chartContainerRef);

    useEffect(() => {
        if (data && data.length > 0) {
            const chart = createChart(chartContainerRef.current, { 
                width: containerWidth, 
                height: 300,
                layout: {
                    textColor: '#fff',
                    background: {
                        type: 'solid',
                        color: 'transparent'
                    },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    barSpacing: 15,
                    rightOffset: 2,
                    borderColor: '#232323',
                    visible: true,
                },
                priceScale: {
                    borderColor: '#2b2b2b',
                    type: 'volume'
                },
                grid: {
                    vertLines: {
                      color: '#32383e', // Color para las líneas verticales
                    //   style: LightweightCharts.LineStyle.Solid, // Estilo de línea (sólida, punteada, etc.)
                    },
                    horzLines: {
                      color: '#32383e', // Color para las líneas horizontales
                    //   style: LightweightCharts.LineStyle.Solid,
                    },
                },
            });

            const lineSeries = chart.addLineSeries({
                color: '#0AB39C', // color de línea
                lineWidth: 2, // ancho de línea
                title: 'Ventas',
            });

            let dataArray = data.map(item => {
                let date = new Date(item.createdAt);

                let timestampInSeconds = Math.floor(date.getTime() / 1000);

                return { time: timestampInSeconds, value: item.unitsSold }
            });

            dataArray = dataArray.sort((a, b) => a.value - b.value);

            dataArray = dataArray.sort((a, b) => a.time - b.time);

            lineSeries.setData(dataArray, { preserveOrder: true });

            // chart.resize(containerWidth, 300);

            // chart.timeScale().fitContent();
    
            return () => {
                chart.remove();
            };
        };
    }, [containerWidth, data]);

    return <div ref={chartContainerRef} />;
};

export { Chart };