import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge, VerificationTierBadge, formatCents } from '../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders confirmed status with green badge', () => {
    render(<StatusBadge status="Confirmed" />);
    expect(screen.getByText('Confirmed')).toBeDefined();
  });

  it('renders critical anomaly severity badge', () => {
    render(<StatusBadge status="critical" />);
    expect(screen.getByText('critical')).toBeDefined();
  });

  it('renders needs review status', () => {
    render(<StatusBadge status="Needs review" />);
    expect(screen.getByText('Needs review')).toBeDefined();
  });

  it('renders verification tier badges', () => {
    render(<VerificationTierBadge tier="human_confirmed" />);
    expect(screen.getByText('Human Confirmed')).toBeDefined();
  });
});

describe('formatCents Helper', () => {
  it('formats cents correctly to USD currency string without float drift', () => {
    expect(formatCents(125000)).toBe('$1,250.00');
    expect(formatCents(100)).toBe('$1.00');
    expect(formatCents(0)).toBe('$0.00');
  });

  it('formats European Euros correctly', () => {
    expect(formatCents(4500, 'EUR')).toBe('€45.00');
  });
});
