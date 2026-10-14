import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductSearch from '../ProductSearch';

describe('ProductSearch Component (MSW Integration)', () => {
    const renderWithRouter = (ui) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>);
    };

    it('valida que la consulta tenga al menos 2 caracteres y mantiene el botón deshabilitado', async () => {
        const user = userEvent.setup();
        renderWithRouter(<ProductSearch />);

        const searchInput = screen.getByRole('searchbox', { name: /Término de búsqueda/i });
        const submitBtn = screen.getByRole('button', { name: /Buscar/i });

        // Inicialmente deshabilitado
        expect(submitBtn).toBeDisabled();

        // Con 1 carácter sigue deshabilitado
        await user.type(searchInput, 'a');
        expect(submitBtn).toBeDisabled();

        // Con 2 caracteres se habilita
        await user.type(searchInput, 'b');
        expect(submitBtn).not.toBeDisabled();
    });

    it('ejecuta la búsqueda y renderiza la tarjeta del producto desde MSW', async () => {
        const user = userEvent.setup();
        renderWithRouter(<ProductSearch />);

        const searchInput = screen.getByRole('searchbox', { name: /Término de búsqueda/i });
        await user.type(searchInput, 'depiladora');

        const submitBtn = screen.getByRole('button', { name: /Buscar/i });
        await user.click(submitBtn);

        // Espera a que desaparezca el loader o aparezca el resultado
        await waitFor(() => {
            expect(screen.getByText(/Resultados para “depiladora”/i)).toBeInTheDocument();
        });

        // La tarjeta del producto mockeado en MSW se renderiza
        expect(screen.getByText(/Producto con término depiladora/i)).toBeInTheDocument();
        expect(screen.getByText(/Ver Análisis y Métricas/i)).toBeInTheDocument();
    });

    it('muestra el estado vacío cuando no existen coincidencias para el término', async () => {
        const user = userEvent.setup();
        renderWithRouter(<ProductSearch />);

        const searchInput = screen.getByRole('searchbox', { name: /Término de búsqueda/i });
        await user.type(searchInput, 'nada');

        const submitBtn = screen.getByRole('button', { name: /Buscar/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/No se encontraron productos coincidentes/i)).toBeInTheDocument();
        });
    });

    it('permite limpiar el input y cerrar el panel de resultados', async () => {
        const user = userEvent.setup();
        renderWithRouter(<ProductSearch />);

        const searchInput = screen.getByRole('searchbox', { name: /Término de búsqueda/i });
        await user.type(searchInput, 'reloj');

        const submitBtn = screen.getByRole('button', { name: /Buscar/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Resultados para “reloj”/i)).toBeInTheDocument();
        });

        // Botón cerrar resultados
        const closeBtn = screen.getByRole('button', { name: /Cerrar Resultados/i });
        await user.click(closeBtn);

        // Ya no se muestra el panel de resultados
        expect(screen.queryByText(/Resultados para “reloj”/i)).not.toBeInTheDocument();

        // Botón limpiar input
        const clearBtn = screen.getByRole('button', { name: /Limpiar texto/i });
        await user.click(clearBtn);
        expect(searchInput).toHaveValue('');
    });
});
