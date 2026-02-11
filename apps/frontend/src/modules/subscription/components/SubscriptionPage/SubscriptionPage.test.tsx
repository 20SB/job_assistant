import { render, screen } from '@testing-library/react';
import { SubscriptionPage } from './SubscriptionPage';

// Mock dependencies
jest.mock('../../hooks/useSubscription', () => ({
  useSubscription: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('SubscriptionPage', () => {
  it('should render without crashing', () => {
    render(<SubscriptionPage />);
    expect(screen.getByText('Subscription')).toBeInTheDocument();
  });

  // Add more tests...
});
