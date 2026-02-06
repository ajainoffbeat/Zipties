import { http, HttpResponse } from 'msw';

export const handlers = [
    // Login handler
    http.post('*/login', async ({ request }) => {
        const { email, password } = (await request.json()) as any;

        if (email === 'test@example.com' && password === 'Password123!') {
            return HttpResponse.json({
                success: true,
                token: 'mock-jwt-token',
                message: 'Login successful',
            });
        }

        return HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
        );
    }),

    // Signup handler
    http.post('*/signup', async ({ request }) => {
        const { email } = (await request.json()) as any;

        if (email === 'existing@example.com') {
            return HttpResponse.json(
                { success: false, error: 'User already exists' },
                { status: 400 }
            );
        }

        return HttpResponse.json({
            success: true,
            token: 'mock-jwt-token',
            message: 'Signup successful',
        });
    }),

    // Forgot password handler
    http.post('*/forgot-password', async ({ request }) => {
        const { email } = (await request.json()) as any;

        if (email === 'valid@example.com') {
            return HttpResponse.json({
                data: {
                    message: 'Reset link sent to your email',
                }
            });
        }

        return HttpResponse.json(
            { error: 'Email not found' },
            { status: 404 }
        );
    }),
];
