import { render, screen } from '@testing-library/react';
import { AdminPage } from './AdminPage';

// Mock dependencies
jest.mock('../../hooks/useAdmin', () => ({
  useAdmin: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('AdminPage', () => {
  it('should render without crashing', () => {
    render(<AdminPage />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  // Add more tests...
});
