import { useEffect } from "react";
import { createChart } from 'lightweight-charts';

const Chart = ({ data }) => {
    useEffect(() => {
        if (data && data.length > 0) {
            const chart = createChart(document.body, { 
                width: 400, 
                height: 250,
                layout: {
                    textColor: '#232323',
                    backgroundColor: '#000000'
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
                color: '#ff9900', // color de línea
                lineWidth: 3, // ancho de línea
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
};

export { Chart };