import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneDialer } from './phone-dialer';

// Mock useSIP hook
const mockMakeCall = jest.fn();
const mockHangup = jest.fn();
const mockToggleMute = jest.fn();

jest.mock('@/hooks/use-sip', () => ({
  useSIP: () => ({
    makeCall: mockMakeCall,
    hangup: mockHangup,
    toggleMute: mockToggleMute,
    currentCall: null,
    isMuted: false,
    registered: true,
  }),
}));

describe('PhoneDialer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    initialPhoneNumber: '09123456789',
    customerName: 'Test Customer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SIP_SERVER = 'wss://sip.example.com';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SIP_SERVER;
  });

  it('renders correctly with initial phone number', () => {
    render(<PhoneDialer {...defaultProps} />);
    
    expect(screen.getByDisplayValue('09123456789')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });

  it('calls makeCall when call button is clicked', () => {
    render(<PhoneDialer {...defaultProps} />);
    
    const callButton = screen.getByRole('button', { name: /call/i });
    fireEvent.click(callButton);
    
    expect(mockMakeCall).toHaveBeenCalledWith('09123456789');
  });
});
