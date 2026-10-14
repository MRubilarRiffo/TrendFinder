import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartBadges from '../SmartBadges';

describe('SmartBadges Component', () => {
    it('renderiza la insignia "🔥 Despegue" cuando isBreakout es true', () => {
        render(<SmartBadges isBreakout={true} />);
        expect(screen.getByText('🔥 Despegue')).toBeInTheDocument();
        expect(screen.queryByText('💎 High Ticket')).not.toBeInTheDocument();
        expect(screen.queryByText('🧊 En Declive')).not.toBeInTheDocument();
        expect(screen.queryByText('⚠️ Poco Stock')).not.toBeInTheDocument();
    });

    it('renderiza la insignia "💎 High Ticket" cuando isHighTicket es true', () => {
        render(<SmartBadges isHighTicket={true} />);
        expect(screen.getByText('💎 High Ticket')).toBeInTheDocument();
        expect(screen.queryByText('🔥 Despegue')).not.toBeInTheDocument();
    });

    it('renderiza la insignia "🧊 En Declive" cuando isDeclining es true', () => {
        render(<SmartBadges isDeclining={true} />);
        expect(screen.getByText('🧊 En Declive')).toBeInTheDocument();
    });

    it('renderiza la insignia "⚠️ Poco Stock" cuando hasLowStock es true', () => {
        render(<SmartBadges hasLowStock={true} />);
        expect(screen.getByText('⚠️ Poco Stock')).toBeInTheDocument();
    });

    it('renderiza múltiples insignias simultáneamente si varias condiciones se cumplen', () => {
        render(<SmartBadges isBreakout={true} isHighTicket={true} hasLowStock={true} />);
        expect(screen.getByText('🔥 Despegue')).toBeInTheDocument();
        expect(screen.getByText('💎 High Ticket')).toBeInTheDocument();
        expect(screen.getByText('⚠️ Poco Stock')).toBeInTheDocument();
        expect(screen.queryByText('🧊 En Declive')).not.toBeInTheDocument();
    });

    it('no renderiza ninguna insignia de texto si todas las propiedades son falsas o indefinidas', () => {
        const { container } = render(<SmartBadges />);
        expect(screen.queryByText(/Despegue|High Ticket|En Declive|Poco Stock/)).not.toBeInTheDocument();
        expect(container.querySelectorAll('span')).toHaveLength(0);
    });
});
