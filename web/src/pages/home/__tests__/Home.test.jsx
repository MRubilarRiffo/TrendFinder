import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';

describe('Home Page (MSW Integration)', () => {
    const renderHome = () => {
        return render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
    };

    it('renderiza el catálogo de productos en tendencia y últimos productos desde MSW', async () => {
        renderHome();

        // Inicialmente muestra loaders
        expect(screen.getByText(/Cargando últimos productos/i)).toBeInTheDocument();
        expect(screen.getByText(/Cargando tendencias/i)).toBeInTheDocument();

        // Tras resolver las peticiones con MSW
        await waitFor(() => {
            expect(screen.getByText('Depiladora Láser IPL')).toBeInTheDocument();
        });

        // Verifica la sección de últimos productos
        expect(screen.getByText('Humidificador Ultrasónico LED')).toBeInTheDocument();

        // Verifica productos en la tabla
        expect(screen.getByText('Reloj Smartwatch Ultra')).toBeInTheDocument();

        // Verifica insignia de GANADOR para DropScore >= 85 (Depiladora tiene 88)
        expect(screen.getByText('🔥 GANADOR')).toBeInTheDocument();
    });

    it('permite cambiar el filtro de días y ordenamiento disparando nuevas consultas', async () => {
        const user = userEvent.setup();
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Depiladora Láser IPL')).toBeInTheDocument();
        });

        // Cambiar periodo a 30 días
        const daysSelect = screen.getByDisplayValue(/Últimos 7 Días/i);
        await user.selectOptions(daysSelect, '30');
        expect(daysSelect).toHaveValue('30');

        // Cambiar ordenamiento a breakout
        const sortSelect = screen.getByDisplayValue(/Ordenar por: Ganancia/i);
        await user.selectOptions(sortSelect, 'breakout');
        expect(sortSelect).toHaveValue('breakout');

        // El componente sigue respondiendo y renderizando
        await waitFor(() => {
            expect(screen.getByText('Depiladora Láser IPL')).toBeInTheDocument();
        });
    });

    it('gestiona la paginación por cursor correctamente', async () => {
        const user = userEvent.setup();
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Depiladora Láser IPL')).toBeInTheDocument();
        });

        const prevBtn = screen.getByRole('button', { name: /Anterior/i });
        const nextBtn = screen.getByRole('button', { name: /Siguiente/i });

        // Anterior debe estar deshabilitado en la primera página
        expect(prevBtn).toBeDisabled();
        // Siguiente debe estar habilitado ya que MSW devuelve nextCursor
        expect(nextBtn).not.toBeDisabled();

        // Hacer clic en Siguiente
        await user.click(nextBtn);

        // Al avanzar, el botón Anterior se habilita
        await waitFor(() => {
            expect(prevBtn).not.toBeDisabled();
        });
    });
});
