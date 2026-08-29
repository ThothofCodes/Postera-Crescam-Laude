// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PCLLogo from '../../components/Logo';

describe('PCLLogo', () => {
  test('renders an img element', () => {
    render(<PCLLogo />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  test('uses wordmark image by default', () => {
    render(<PCLLogo />);
    const img = screen.getByRole('img');
    expect(img.src).toContain('postera-wordmark.png');
  });

  test('uses mark image when showText is false and size is small', () => {
    render(<PCLLogo showText={false} size={24} />);
    const img = screen.getByRole('img');
    expect(img.src).toContain('postera-mark.png');
  });

  test('uses wordmark when showText is false but size >= 36', () => {
    render(<PCLLogo showText={false} size={40} />);
    const img = screen.getByRole('img');
    expect(img.src).toContain('postera-wordmark.png');
  });

  test('applies custom size', () => {
    render(<PCLLogo size={60} />);
    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ height: '60px' });
  });

  test('has alt text', () => {
    render(<PCLLogo />);
    expect(screen.getByAltText('Postera Crescam Laude')).toBeInTheDocument();
  });
});
