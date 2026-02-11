import { render, screen } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';

// Mock dependencies
jest.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('DashboardPage', () => {
  it('should render without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  // Add more tests...
});
