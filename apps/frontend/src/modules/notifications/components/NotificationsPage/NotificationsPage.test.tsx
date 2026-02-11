import { render, screen } from '@testing-library/react';
import { NotificationsPage } from './NotificationsPage';

// Mock dependencies
jest.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('NotificationsPage', () => {
  it('should render without crashing', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  // Add more tests...
});
