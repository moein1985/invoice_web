import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuthStore
const mockLogin = jest.fn();
jest.mock('@/lib/auth-store', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      login: mockLogin,
    };
    return selector(state);
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('ورود به سیستم')).toBeInTheDocument();
    expect(screen.getByLabelText('نام کاربری')).toBeInTheDocument();
    expect(screen.getByLabelText('رمز عبور')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ورود/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText('نام کاربری'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'password' } });
    
    fireEvent.click(screen.getByRole('button', { name: /ورود/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'password');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText('نام کاربری'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'wrong' } });
    
    fireEvent.click(screen.getByRole('button', { name: /ورود/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
