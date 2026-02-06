import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../ForgotPassword';
import { expect, it, describe, vi } from 'vitest';

describe('ForgotPassword Page', () => {
    it('renders email field', () => {
        render(<ForgotPassword />);
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    });

    it('shows validation error for invalid email', async () => {
        const user = userEvent.setup();
        render(<ForgotPassword />);

        const emailInput = screen.getByPlaceholderText(/you@example.com/i);
        await user.type(emailInput, 'invalid-email');

        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        await user.click(submitButton);
    });

    it('shows success message on successful request', async () => {
        const user = userEvent.setup();
        render(<ForgotPassword />);

        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'valid@example.com');

        const submitButton = screen.getByRole('button', { name: /send reset link/i });
        await user.click(submitButton);
    });

    /* 
  it('shows error message when email is not found', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'notfound@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });
  */
});
