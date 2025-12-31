import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IconPicker from './IconPicker';
import { AVAILABLE_ICONS } from '../utils/iconUtils';

describe('IconPicker', () => {
    const mockSelect = vi.fn();
    const defaultIcon = AVAILABLE_ICONS[0].name;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders currently selected icon correctly', () => {
        const { container } = render(
            <IconPicker
                selectedIcon={defaultIcon}
                onSelect={mockSelect}
            />
        );
        // Should find the button
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        // Should verify SVG is present (simplest check for icon)
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('toggles dropdown on click', () => {
        render(
            <IconPicker
                selectedIcon={defaultIcon}
                onSelect={mockSelect}
            />
        );

        const triggerButton = screen.getByRole('button');

        // Initially closed - popup content should not be visible
        // We can check by looking for an icon that is NOT the selected one, which should be in the list
        const otherIcon = AVAILABLE_ICONS[1];
        expect(screen.queryByTitle(otherIcon.label)).not.toBeInTheDocument();

        // Open
        fireEvent.click(triggerButton);

        // Expect dropdown content
        // Should show all icons
        AVAILABLE_ICONS.forEach(icon => {
            expect(screen.getByTitle(icon.label)).toBeInTheDocument();
        });

        // Toggle close
        // Note: The main button is still there. Clicking it again should close.
        // Wait, the main button is BEHIND the backdrop div if z-index is lower?
        // Layout:
        // button (trigger)
        // {isOpen && ( <> <div backdrop onClick={close} /> <div popup ... /> </> )}

        // The backdrop is fixed inset-0 z-10.
        // The dropdown is z-20.
        // The button has no z-index specified in snippet, likely auto (0).
        // So clicking "triggerButton" again might actually click the backdrop if it covers it?
        // Or if the button is outside the portal... wait, it's not a portal. It's inline.
        // "absolute top-14 left-0 z-20"

        // Let's click the trigger button again if we can access it; 
        // effectively checking if we can close it. 
        // Actually the backlog div covers the screen "fixed inset-0".
        // So hitting "button" might fail if it's covered.
        // Let's click the backdrop to test closing.
    });

    it('closes on backdrop click', () => {
        render(
            <IconPicker
                selectedIcon={defaultIcon}
                onSelect={mockSelect}
            />
        );

        const triggerButton = screen.getByRole('button');
        fireEvent.click(triggerButton);

        // Verify open
        expect(screen.getByTitle(AVAILABLE_ICONS[1].label)).toBeInTheDocument();

        // Find backdrop. It has class "fixed inset-0 z-10" and onClick handlers.
        // It doesn't have a role, so let's find by generic container or just click appropriate coord?
        // Easier: render interacts with virtual DOM.
        // Let's find the div that acts as backdrop.
        // It's the sibling of the popup list.
        // We can query selector.
        // render returns { container }.
        const backdrop = document.querySelector('.fixed.inset-0.z-10');
        expect(backdrop).toBeInTheDocument();

        if (backdrop) {
            fireEvent.click(backdrop);
        }

        // Verify closed
        expect(screen.queryByTitle(AVAILABLE_ICONS[1].label)).not.toBeInTheDocument();
    });

    it('selects an icon and closes dropdown', () => {
        render(
            <IconPicker
                selectedIcon={defaultIcon}
                onSelect={mockSelect}
            />
        );

        // Open
        fireEvent.click(screen.getByRole('button'));

        // Select second icon
        const targetIcon = AVAILABLE_ICONS[1];
        const targetBtn = screen.getByTitle(targetIcon.label);

        fireEvent.click(targetBtn);

        // Should call onSelect
        expect(mockSelect).toHaveBeenCalledWith(targetIcon.name);

        // Should close
        expect(screen.queryByTitle(AVAILABLE_ICONS[2].label)).not.toBeInTheDocument();
    });

    it('highlights selected icon in dropdown', () => {
        const selected = AVAILABLE_ICONS[1];
        render(
            <IconPicker
                selectedIcon={selected.name}
                onSelect={mockSelect}
            />
        );

        // Open
        fireEvent.click(screen.getByRole('button'));

        // Check style of selected button
        const selectedBtn = screen.getByTitle(selected.label);
        expect(selectedBtn.className).toContain('bg-blue-50');
        expect(selectedBtn.className).toContain('text-blue-600');

        // Check unselected
        const unselected = AVAILABLE_ICONS[0];
        const unselectedBtn = screen.getByTitle(unselected.label);
        expect(unselectedBtn.className).toContain('text-slate-400');
    });
});
