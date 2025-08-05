import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders Patwua text', () => {
  render(<App />);
  expect(screen.getByText(/Patwua/i)).toBeInTheDocument();
});
