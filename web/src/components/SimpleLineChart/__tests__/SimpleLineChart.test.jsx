import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimpleLineChart from '../SimpleLineChart';

describe('SimpleLineChart Component', () => {
    it('muestra el mensaje de estado vacío cuando los datos están vacíos o indefinidos', () => {
        const { rerender } = render(<SimpleLineChart data={[]} />);
        expect(screen.getByText('Sin datos para este periodo')).toBeInTheDocument();

        rerender(<SimpleLineChart data={null} />);
        expect(screen.getByText('Sin datos para este periodo')).toBeInTheDocument();
    });

    it('renderiza el SVG y la polilínea cuando recibe datos numéricos válidos', () => {
        const data = [10, 20, 15, 30];
        const { container } = render(<SimpleLineChart data={data} color="#10b981" />);

        const polyline = container.querySelector('polyline');
        expect(polyline).toBeInTheDocument();
        expect(polyline).toHaveAttribute('stroke', '#10b981');

        const points = polyline.getAttribute('points');
        expect(points).toBeTruthy();
        expect(points.split(' ')).toHaveLength(4);
    });

    it('maneja datos con varianza cero sin arrojar NaN ni errores de división por cero', () => {
        const data = [5, 5, 5];
        const { container } = render(<SimpleLineChart data={data} />);

        const polyline = container.querySelector('polyline');
        expect(polyline).toBeInTheDocument();
        const points = polyline.getAttribute('points');
        expect(points).not.toContain('NaN');
    });

    it('formatea y distribuye las etiquetas de fecha en formato DD/MM', () => {
        const data = [10, 20, 30];
        const labels = ['2026-03-01', '2026-03-02', '2026-03-03'];

        render(<SimpleLineChart data={data} labels={labels} />);

        // Primera fecha formateada a DD/MM
        expect(screen.getByText('01/03')).toBeInTheDocument();
        // Última fecha formateada
        expect(screen.getByText('03/03')).toBeInTheDocument();
    });

    it('activa la línea guía punteada y el valor al hacer hover sobre un punto', () => {
        const data = [12, 24];
        const { container } = render(<SimpleLineChart data={data} />);

        const captureRects = container.querySelectorAll('rect');
        expect(captureRects.length).toBeGreaterThan(0);

        // Al inicio no hay línea punteada
        expect(container.querySelector('line[stroke-dasharray="4 4"]')).not.toBeInTheDocument();

        // Disparar hover en el primer punto
        fireEvent.mouseEnter(captureRects[0]);

        const guideline = container.querySelector('line[stroke-dasharray="4 4"]');
        expect(guideline).toBeInTheDocument();

        // Disparar mouseLeave
        fireEvent.mouseLeave(captureRects[0]);
        expect(container.querySelector('line[stroke-dasharray="4 4"]')).not.toBeInTheDocument();
    });
});
