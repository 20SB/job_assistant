import { render, screen } from '@testing-library/react';
import { CvPage } from './CvPage';

// Mock dependencies
jest.mock('../../hooks/useCv', () => ({
  useCv: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('CvPage', () => {
  it('should render without crashing', () => {
    render(<CvPage />);
    expect(screen.getByText('Cv')).toBeInTheDocument();
  });

  // Add more tests...
});
