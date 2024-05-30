import { useEffect, useRef } from "react";
import { createChart } from 'lightweight-charts';

const Chart = ({ data }) => {
    const chartContainerRef = useRef();
    useEffect(() => {
        if (data && data.length > 0) {
            const chart = createChart(chartContainerRef.current, { 
                width: 600, 
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
                    secondsVisible: true,
                    barSpacing: 15,
                    rightOffset: 2,
                    borderColor: '#232323',
                    visible: true,
                },
                priceScale: {
                    borderColor: '#2b2b2b',
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

            if (dataArray.length > 1) {
                dataArray.pop();
            };

            dataArray = dataArray.sort((a, b) => a.time - b.time);

            lineSeries.setData(dataArray, { preserveOrder: true });

            // chart.timeScale().fitContent();
    
            return () => {
                chart.remove();
            };
        };
    }, []);

    return <div ref={chartContainerRef} />;
};

export { Chart };