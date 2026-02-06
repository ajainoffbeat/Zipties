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

describe('Signup Page', () => {
    it('renders all required fields for signup', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        // Switch to signup
        const toggleButton = screen.getByRole('button', { name: /sign up/i });
        await user.click(toggleButton);

        expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
        // Two password fields with same placeholder, use getAllByPlaceholderText if needed
        const passwordFields = screen.getAllByPlaceholderText(/••••••••/i);
        expect(passwordFields).toHaveLength(2);
    });

    it('shows validation errors for password mismatch', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        // Switch to signup
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'new@example.com');

        const passwordFields = screen.getAllByPlaceholderText(/••••••••/i);
        await user.type(passwordFields[0], 'Password123!');
        await user.type(passwordFields[1], 'Different123!');

        const submitButton = screen.getByRole('button', { name: /create account/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
    });

    it('successful signup redirects user', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        // Switch to signup
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'new@example.com');

        const passwordFields = screen.getAllByPlaceholderText(/••••••••/i);
        await user.type(passwordFields[0], 'Password123!');
        await user.type(passwordFields[1], 'Password123!');

        const submitButton = screen.getByRole('button', { name: /create account/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockedUsedNavigate).toHaveBeenCalledWith('/feed');
        });
    });

    it('failed signup handles API error', async () => {
        const user = userEvent.setup();
        render(<Auth />);

        // Switch to signup
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        await user.type(screen.getByPlaceholderText(/John Doe/i), 'John Doe');
        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'existing@example.com');

        const passwordFields = screen.getAllByPlaceholderText(/••••••••/i);
        await user.type(passwordFields[0], 'Password123!');
        await user.type(passwordFields[1], 'Password123!');

        const submitButton = screen.getByRole('button', { name: /create account/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
        });
    });
});
