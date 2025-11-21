import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomersPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock ProtectedRoute to just render children
jest.mock('@/components/protected-route', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

// Mock PhoneDialer
jest.mock('@/components/phone-dialer', () => ({
  PhoneDialer: () => <div>PhoneDialer</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('CustomersPage', () => {
  it('renders customers list', async () => {
    // Mock data
    const mockCustomers = {
      data: [
        {
          id: '1',
          code: 'C001',
          name: 'John Doe',
          phone: '1234567890',
          email: 'john@example.com',
          isActive: true,
          creditLimit: 0,
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    const { apiClient } = require('@/lib/api-client');
    apiClient.get.mockResolvedValue(mockCustomers);

    render(
      <QueryClientProvider client={queryClient}>
        <CustomersPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('مدیریت مشتریان')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('C001')).toBeInTheDocument();
    });
  });
});
