import { render, screen } from '@testing-library/react';
import { PreferencesPage } from './PreferencesPage';

// Mock dependencies
jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('PreferencesPage', () => {
  it('should render without crashing', () => {
    render(<PreferencesPage />);
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  // Add more tests...
});
