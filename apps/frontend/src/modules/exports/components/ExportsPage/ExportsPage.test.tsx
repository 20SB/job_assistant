import { render, screen } from '@testing-library/react';
import { ExportsPage } from './ExportsPage';

// Mock dependencies
jest.mock('../../hooks/useExports', () => ({
  useExports: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('ExportsPage', () => {
  it('should render without crashing', () => {
    render(<ExportsPage />);
    expect(screen.getByText('Exports')).toBeInTheDocument();
  });

  // Add more tests...
});
