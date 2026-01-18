import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock global fetch
        vi.stubGlobal('fetch', vi.fn());

        // Mock window.location
        delete window.location;
        window.location = { href: '' };
    });

    afterEach(() => {
        cleanup();
    });

    it('renders login form with all elements', () => {
        render(<LoginForm />);

        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Sign in$/i })).toBeInTheDocument();
    });

    it('updates input values on change', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText(/Email address/i);
        const passwordInput = screen.getByPlaceholderText(/Password/i);

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('handles successful login and redirects', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockImplementationOnce(() =>
            new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ success: true }),
            }), 50))
        );

        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText(/Email address/i);
        const passwordInput = screen.getByPlaceholderText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /^Sign in$/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(window.location.href).toBe('/admin');
        });
    });

    it('displays error message on failed login', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Invalid credentials' }),
        });

        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText(/Email address/i);
        const passwordInput = screen.getByPlaceholderText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /^Sign in$/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        const errorMessage = await screen.findByText(/Invalid credentials/i);
        expect(errorMessage).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Sign in');
    });

    it('handles network errors gracefully', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText(/Email address/i);
        const passwordInput = screen.getByPlaceholderText(/Password/i);
        const submitButton = screen.getByRole('button', { name: /^Sign in$/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        const errorMessage = await screen.findByText(/Network error/i);
        expect(errorMessage).toBeInTheDocument();
    });

});
