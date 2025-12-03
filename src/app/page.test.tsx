import { render } from '@testing-library/react';
import Page from './page';

jest.mock('@/components/DownloadForm', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-download-form">Mocked DownloadForm</div>,
}));

describe('Home Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
  });

  it('renders a main element', () => {
    const { container } = render(<Page />);
    const main = container.querySelector('main');
    expect(main).toBeTruthy();
  });
});
