import { render, screen } from '@testing-library/react';
import { JobsPage } from './JobsPage';

// Mock dependencies
jest.mock('../../hooks/useJobs', () => ({
  useJobs: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('JobsPage', () => {
  it('should render without crashing', () => {
    render(<JobsPage />);
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  // Add more tests...
});
