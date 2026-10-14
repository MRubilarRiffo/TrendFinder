import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DualLineChart from '../DualLineChart';

describe('DualLineChart Component', () => {
    it('muestra el mensaje de estado vacío cuando ambos conjuntos de datos están vacíos', () => {
        const { rerender } = render(<DualLineChart data1={[]} data2={[]} />);
        expect(screen.getByText('Sin datos para este periodo')).toBeInTheDocument();

        rerender(<DualLineChart data1={null} data2={null} />);
        expect(screen.getByText('Sin datos para este periodo')).toBeInTheDocument();
    });

    it('renderiza dos polilíneas (una continua y una discontinua) cuando recibe datos', () => {
        const data1 = [10, 20, 30]; // Ventas
        const data2 = [50, 80, 100]; // Visitas

        const { container } = render(
            <DualLineChart
                data1={data1}
                data2={data2}
                color1="#00bfff"
                color2="#a78bfa"
            />
        );

        const polylines = container.querySelectorAll('polyline');
        expect(polylines).toHaveLength(2);

        // Línea 1: continua (ventas)
        expect(polylines[0]).toHaveAttribute('stroke', '#00bfff');
        expect(polylines[0]).not.toHaveAttribute('stroke-dasharray');

        // Línea 2: discontinua (visitas)
        expect(polylines[1]).toHaveAttribute('stroke', '#a78bfa');
        expect(polylines[1]).toHaveAttribute('stroke-dasharray', '4');
    });

    it('distribuye y formatea las etiquetas de fecha en formato DD/MM', () => {
        const data1 = [5, 10, 15];
        const labels = ['2026-03-10', '2026-03-11', '2026-03-12'];

        render(<DualLineChart data1={data1} data2={[]} labels={labels} />);

        expect(screen.getByText('10/03')).toBeInTheDocument();
        expect(screen.getByText('12/03')).toBeInTheDocument();
    });
});
