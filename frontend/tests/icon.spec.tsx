import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Icon from '@/components/Icon';

describe('Icon component', () => {
  it('renders icon with kebab-case name', () => {
    const { container } = render(<Icon name="chevron-right" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders icon with lowercase name', () => {
    const { container } = render(<Icon name="plus" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders icon with PascalCase name', () => {
    const { container } = render(<Icon name="ChevronRight" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns null and warns for invalid icon name', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name="invalid-icon-name" />);

    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Icon "invalid-icon-name" not found in Lucide icons'
    );

    consoleSpy.mockRestore();
  });

  it('passes props to the icon component', () => {
    const { container } = render(
      <Icon name="home" size={24} color="red" className="test-class" />
    );
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('test-class');
  });
});
