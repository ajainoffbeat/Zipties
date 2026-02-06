import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import Auth from '../Auth';
import { expect, it, describe, vi } from 'vitest';

// Mock useNavigate
const mockedUsedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedUsedNavigate,
    };
});

describe('Login Page', () => {
    it('renders email and password fields', () => {
        render(<Auth />);
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty inputs', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
            expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });
    });

    it('disables submit button while loading', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'Password123!');

        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // We don't await the click here to catch the disabled state
        user.click(submitButton);

        await waitFor(() => {
            expect(submitButton).toBeDisabled();
        });
    });

    it('successful login redirects user', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'Password123!');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockedUsedNavigate).toHaveBeenCalledWith('/feed');
        });
    });

    it('failed login shows error message', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'wrong@example.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpass');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);
    });
});
