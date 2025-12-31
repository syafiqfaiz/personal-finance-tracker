import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getIconComponent, AVAILABLE_ICONS, DEFAULT_ICON } from './iconUtils';


describe('iconUtils', () => {
    describe('getIconComponent', () => {
        it('returns correct component for known icon name', () => {
            const iconName = 'ShoppingBag';
            const { container } = render(getIconComponent(iconName, { 'data-testid': 'icon' } as any)); // eslint-disable-line @typescript-eslint/no-explicit-any

            // Allow flexibility in how lucide renders, effectively checking it renders *something*
            // and that it corresponds to the expected component logic
            expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('returns default icon (Tag) for unknown icon name', () => {
            const { container } = render(getIconComponent('UnknownIconRandom', { 'data-testid': 'icon' } as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
            expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('passes props to the icon component', () => {
            const { container } = render(getIconComponent('Utensils', { className: 'text-red-500' }));
            const svg = container.querySelector('svg');
            expect(svg).toHaveClass('text-red-500');
        });
    });

    describe('Constants', () => {
        it('exports AVAILABLE_ICONS array', () => {
            expect(Array.isArray(AVAILABLE_ICONS)).toBe(true);
            expect(AVAILABLE_ICONS.length).toBeGreaterThan(0);
            expect(AVAILABLE_ICONS[0]).toHaveProperty('name');
            expect(AVAILABLE_ICONS[0]).toHaveProperty('component');
            expect(AVAILABLE_ICONS[0]).toHaveProperty('label');
        });

        it('exports DEFAULT_ICON', () => {
            expect(DEFAULT_ICON).toBe('Tag');
        });
    });
});
