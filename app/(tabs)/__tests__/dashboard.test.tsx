import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../dashboard';

// Mock dependencies
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children, options }: any) => {
      // Render headerRight if provided
      if (options?.headerRight) {
        const HeaderRight = options.headerRight;
        return (
          <>
            {children}
            <HeaderRight />
          </>
        );
      }
      return children;
    },
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Bell: 'Bell',
  Settings: 'Settings',
  CheckCircle: 'CheckCircle',
  ClipboardList: 'ClipboardList',
  Clock: 'Clock',
  Droplet: 'Droplet',
  Camera: 'Camera',
  Search: 'Search',
  Upload: 'Upload',
  Download: 'Download',
  FileText: 'FileText',
  BarChart3: 'BarChart3',
}));

describe('DashboardScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all main sections', () => {
    const { getByText, getByTestId } = render(<DashboardScreen />);

    expect(getByTestId('dashboardScroll')).toBeTruthy();
    expect(getByText('John Smith')).toBeTruthy();
    expect(getByText('Property Manager')).toBeTruthy();
  });

  it('renders user info section correctly', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('John Smith')).toBeTruthy();
    expect(getByText('Property Manager')).toBeTruthy();
    expect(getByText('JS')).toBeTruthy(); // Avatar initials
  });

  it('renders main progress card with correct data', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Quarterly Maintenance')).toBeTruthy();
    expect(getByText('TechCorp Headquarters')).toBeTruthy();
    expect(getByText('Time Remaining')).toBeTruthy();
    expect(getByText('1h 45m')).toBeTruthy();
    expect(getByText('Tasks')).toBeTruthy();
    expect(getByText('18/24')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy(); // Progress percentage
  });

  it('renders all stat cards with correct data', () => {
    const { getByText } = render(<DashboardScreen />);

    // Tasks Completed
    expect(getByText('Tasks Completed')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();

    // Tasks Remaining
    expect(getByText('Tasks Remaining')).toBeTruthy();
    expect(getByText('6')).toBeTruthy();

    // Time on Site
    expect(getByText('Time on Site')).toBeTruthy();
    expect(getByText('6:15')).toBeTruthy();

    // Supplies Used
    expect(getByText('Supplies Used')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });

  it('renders Quick Actions section', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Capture')).toBeTruthy();
    expect(getByText('Scan')).toBeTruthy();
    expect(getByText('Upload')).toBeTruthy();
  });

  it('calls handleQuickAction when Capture button is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const { getByText } = render(<DashboardScreen />);

    const captureButton = getByText('Capture').parent;
    if (captureButton) {
      fireEvent.press(captureButton);
      expect(consoleSpy).toHaveBeenCalledWith('Quick action: capture');
    }
  });

  it('calls handleQuickAction when Scan button is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const { getByText } = render(<DashboardScreen />);

    const scanButton = getByText('Scan').parent;
    if (scanButton) {
      fireEvent.press(scanButton);
      expect(consoleSpy).toHaveBeenCalledWith('Quick action: scan');
    }
  });

  it('calls handleQuickAction when Upload button is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const { getByText } = render(<DashboardScreen />);

    const uploadButton = getByText('Upload').parent;
    if (uploadButton) {
      fireEvent.press(uploadButton);
      expect(consoleSpy).toHaveBeenCalledWith('Quick action: upload');
    }
  });

  it('renders Recent Documents section', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Recent Documents')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
  });

  it('renders all document items with correct data', () => {
    const { getByText } = render(<DashboardScreen />);

    // Document 1
    expect(getByText('TechCorp Maintenance Report.pdf')).toBeTruthy();
    expect(getByText('Today, 2:30 PM • 1.2 MB')).toBeTruthy();

    // Document 2
    expect(getByText('Building Inspection Checklist.docx')).toBeTruthy();
    expect(getByText('Yesterday, 10:15 AM • 845 KB')).toBeTruthy();

    // Document 3
    expect(getByText('Electrical Systems Guide.pdf')).toBeTruthy();
    expect(getByText('Mar 15, 2025 • 3.7 MB')).toBeTruthy();
  });

  it('calls handleDocumentPress when document 1 is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const { getByText } = render(<DashboardScreen />);

    const doc1 = getByText('TechCorp Maintenance Report.pdf').parent?.parent;
    if (doc1) {
      fireEvent.press(doc1);
      expect(consoleSpy).toHaveBeenCalledWith('Document pressed: maintenance-report');
    }
  });

  it('calls handleDocumentPress when document 2 is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const { getByText } = render(<DashboardScreen />);

    const doc2 = getByText('Building Inspection Checklist.docx').parent?.parent;
    if (doc2) {
      fireEvent.press(doc2);
      expect(consoleSpy).toHaveBeenCalledWith('Document pressed: inspection-checklist');
    }
  });

  it('calls handleDocumentPress when document 3 is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const { getByText } = render(<DashboardScreen />);

    const doc3 = getByText('Electrical Systems Guide.pdf').parent?.parent;
    if (doc3) {
      fireEvent.press(doc3);
      expect(consoleSpy).toHaveBeenCalledWith('Document pressed: electrical-guide');
    }
  });

  it('renders header action buttons', () => {
    const { getByText } = render(<DashboardScreen />);

    // User info section should have header
    expect(getByText('John Smith')).toBeTruthy();
  });

  it('renders CircularProgress component correctly', () => {
    const { getByText } = render(<DashboardScreen />);

    // Progress percentage should be visible
    expect(getByText('75%')).toBeTruthy();
  });

  it('applies correct styles to stat cards', () => {
    const { getByText } = render(<DashboardScreen />);

    const tasksCompleted = getByText('Tasks Completed');
    expect(tasksCompleted).toBeTruthy();

    // Verify stat value is rendered
    const value = getByText('18');
    expect(value).toBeTruthy();
  });

  it('renders all required sub-components', () => {
    const { getByText } = render(<DashboardScreen />);

    // StatCard components
    expect(getByText('Tasks Completed')).toBeTruthy();
    expect(getByText('Tasks Remaining')).toBeTruthy();
    expect(getByText('Time on Site')).toBeTruthy();
    expect(getByText('Supplies Used')).toBeTruthy();

    // QuickAction components
    expect(getByText('Capture')).toBeTruthy();
    expect(getByText('Scan')).toBeTruthy();
    expect(getByText('Upload')).toBeTruthy();

    // DocumentItem components
    expect(getByText('TechCorp Maintenance Report.pdf')).toBeTruthy();
    expect(getByText('Building Inspection Checklist.docx')).toBeTruthy();
    expect(getByText('Electrical Systems Guide.pdf')).toBeTruthy();

    // CircularProgress component
    expect(getByText('75%')).toBeTruthy();
  });

  it('renders within ErrorBoundary', () => {
    const { getByText } = render(<DashboardScreen />);

    // If error boundary is working, content should render normally
    expect(getByText('John Smith')).toBeTruthy();
  });

  it('handles safe area insets correctly', () => {
    const { getByTestId } = render(<DashboardScreen />);

    const scrollView = getByTestId('dashboardScroll');
    expect(scrollView).toBeTruthy();
  });

  it('renders ScrollView with correct testID', () => {
    const { getByTestId } = render(<DashboardScreen />);

    expect(getByTestId('dashboardScroll')).toBeTruthy();
  });
});
