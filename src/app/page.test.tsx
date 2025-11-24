import { render } from '@testing-library/react';
import Page from './page';

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
