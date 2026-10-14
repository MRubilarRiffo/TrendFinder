import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinancialInputsPanel from '../FinancialInputsPanel';
import { DEFAULT_FINANCIAL_INPUTS } from '../constants';

describe('FinancialInputsPanel Component', () => {
    it('renderiza inicialmente los inputs con los valores por defecto del dominio', () => {
        const { container } = render(<FinancialInputsPanel onApplyParams={vi.fn()} />);

        const shippingPrepaidInput = container.querySelector('input[name="shippingCostPrepaid"]');
        const profitPrepaidInput = container.querySelector('input[name="desiredProfitPrepaid"]');
        const commissionInput = container.querySelector('input[name="commissionPctPrepaid"]');
        const deliveryRateInput = container.querySelector('input[name="deliveryRatePctCod"]');

        expect(shippingPrepaidInput).toHaveValue(DEFAULT_FINANCIAL_INPUTS.shippingCostPrepaid);
        expect(profitPrepaidInput).toHaveValue(DEFAULT_FINANCIAL_INPUTS.desiredProfitPrepaid);
        expect(commissionInput).toHaveValue(DEFAULT_FINANCIAL_INPUTS.commissionPctPrepaid);
        expect(deliveryRateInput).toHaveValue(DEFAULT_FINANCIAL_INPUTS.deliveryRatePctCod);
    });

    it('emite los parámetros con normalización porcentual exacta al enviar el formulario', async () => {
        const user = userEvent.setup();
        const handleApply = vi.fn();

        const { container } = render(<FinancialInputsPanel onApplyParams={handleApply} />);

        // Modificar input de tasa de entrega COD (name="deliveryRatePctCod")
        const deliveryRateInput = container.querySelector('input[name="deliveryRatePctCod"]');
        await user.clear(deliveryRateInput);
        await user.type(deliveryRateInput, '80');

        // Modificar input de comisión prepago (name="commissionPctPrepaid")
        const commissionInput = container.querySelector('input[name="commissionPctPrepaid"]');
        await user.clear(commissionInput);
        await user.type(commissionInput, '10');

        // Hacer clic en Recalcular Precios
        const submitBtn = screen.getByRole('button', { name: /Recalcular Precios/i });
        await user.click(submitBtn);

        expect(handleApply).toHaveBeenCalledTimes(1);
        expect(handleApply).toHaveBeenCalledWith(
            expect.objectContaining({
                deliveryRatePctCod: 0.8, // 80 / 100
                commissionPctPrepaid: 0.1 // 10 / 100
            })
        );
    });

    it('sanitiza campos vacíos convirtiéndolos a 0 en lugar de NaN', async () => {
        const user = userEvent.setup();
        const handleApply = vi.fn();

        const { container } = render(<FinancialInputsPanel onApplyParams={handleApply} />);

        const cpaCodInput = container.querySelector('input[name="cpaCod"]');
        await user.clear(cpaCodInput);

        const submitBtn = screen.getByRole('button', { name: /Recalcular Precios/i });
        await user.click(submitBtn);

        expect(handleApply).toHaveBeenCalledTimes(1);
        expect(handleApply).toHaveBeenCalledWith(
            expect.objectContaining({
                cpaCod: 0
            })
        );
    });

    it('restablece los inputs y emite los parámetros por defecto al hacer clic en "Restablecer Defaults"', async () => {
        const user = userEvent.setup();
        const handleApply = vi.fn();

        const { container } = render(<FinancialInputsPanel onApplyParams={handleApply} />);

        const profitCodInput = container.querySelector('input[name="desiredProfitCod"]');
        await user.clear(profitCodInput);
        await user.type(profitCodInput, '35000');
        expect(profitCodInput).toHaveValue(35000);

        // Hacer clic en Restablecer Defaults
        const resetBtn = screen.getByRole('button', { name: /Restablecer Defaults/i });
        await user.click(resetBtn);

        // El valor vuelve al default
        expect(profitCodInput).toHaveValue(DEFAULT_FINANCIAL_INPUTS.desiredProfitCod);

        // Se disparó el callback con los valores originales normalizados
        expect(handleApply).toHaveBeenCalledWith(
            expect.objectContaining({
                desiredProfitCod: DEFAULT_FINANCIAL_INPUTS.desiredProfitCod,
                deliveryRatePctCod: DEFAULT_FINANCIAL_INPUTS.deliveryRatePctCod / 100
            })
        );
    });

    it('permite colapsar y expandir el contenido del panel', async () => {
        const user = userEvent.setup();
        const { container } = render(<FinancialInputsPanel onApplyParams={vi.fn()} />);

        // Al inicio los inputs están visibles
        expect(container.querySelector('input[name="shippingCostPrepaid"]')).toBeInTheDocument();

        // Clic en el botón toggle para ocultar
        const toggleBtn = screen.getByRole('button', { name: /Ocultar/i });
        await user.click(toggleBtn);

        // Al colapsar, el formulario no se muestra
        expect(container.querySelector('input[name="shippingCostPrepaid"]')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Configurar/i })).toBeInTheDocument();

        // Clic de nuevo para expandir
        await user.click(screen.getByRole('button', { name: /Configurar/i }));
        expect(container.querySelector('input[name="shippingCostPrepaid"]')).toBeInTheDocument();
    });
});
