import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetails from '../ProductDetails';

describe('ProductDetails Page (MSW Integration)', () => {
    const renderDetails = (initialEntry = '/product/prod-101') => {
        return render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/" element={<div>Página de Inicio</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renderiza la ficha técnica completa, métricas de venta y KPIs desde MSW', async () => {
        renderDetails();

        expect(screen.getByText(/Cargando estadísticas del producto/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: 'Depiladora Láser IPL' })).toBeInTheDocument();
        });

        // DropScore visible
        expect(screen.getByText('88')).toBeInTheDocument();

        // Bloques financieros
        expect(screen.getByText(/Sugerido Contra Entrega/i)).toBeInTheDocument();
        expect(screen.getByText('$ 89.900')).toBeInTheDocument();
        expect(screen.getByText('$ 24.500')).toBeInTheDocument();

        expect(screen.getByText(/Sugerido Pago Anticipado/i)).toBeInTheDocument();
        expect(screen.getByText('$ 79.900')).toBeInTheDocument();

        // Tarjetas KPI
        expect(screen.getByText(/Total Ventas/i)).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText(/Ingresos Totales/i)).toBeInTheDocument();
        expect(screen.getByText('$ 10.788.000')).toBeInTheDocument();

        // Enlace al proveedor
        const providerLink = screen.getByRole('link', { name: /Ver en Proveedor/i });
        expect(providerLink).toHaveAttribute('href', 'https://dropi.co/products/999');
        expect(providerLink).toHaveAttribute('target', '_blank');
        expect(providerLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('permite cambiar el filtro de periodo histórico de ventas', async () => {
        const user = userEvent.setup();
        renderDetails();

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: 'Depiladora Láser IPL' })).toBeInTheDocument();
        });

        const periodSelect = screen.getByDisplayValue(/30 Días/i);
        await user.selectOptions(periodSelect, '7');
        expect(periodSelect).toHaveValue('7');

        // El título del gráfico se actualiza
        await waitFor(() => {
            expect(screen.getByText(/Historial de Ventas \(7 Días\)/i)).toBeInTheDocument();
        });
    });

    it('muestra el estado de error y botón para volver al inicio cuando el producto no existe o falla la API', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        renderDetails('/product/error-id');

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 2, name: 'Error' })).toBeInTheDocument();
        });

        expect(screen.getByText(/No se encontraron datos para este producto/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Volver al Inicio/i })).toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});
