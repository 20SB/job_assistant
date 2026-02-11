import { render, screen } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';

// Mock dependencies
jest.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('SettingsPage', () => {
  it('should render without crashing', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  // Add more tests...
});
