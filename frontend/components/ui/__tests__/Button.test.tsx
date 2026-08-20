import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DangerButton,
  IconButton,
  LoadingButton,
} from '../Button';

describe('Reusable Button Components (Issue #621)', () => {
  it('renders primary button with children text', () => {
    render(<PrimaryButton>Click Me</PrimaryButton>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('renders secondary button variant', () => {
    render(<SecondaryButton>Secondary</SecondaryButton>);
    expect(screen.getByRole('button', { name: /secondary/i })).toBeInTheDocument();
  });

  it('renders ghost button variant', () => {
    render(<GhostButton>Ghost</GhostButton>);
    expect(screen.getByRole('button', { name: /ghost/i })).toBeInTheDocument();
  });

  it('renders danger button variant', () => {
    render(<DangerButton>Delete Account</DangerButton>);
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('renders icon button variant', () => {
    render(<IconButton aria-label="Settings">⚙️</IconButton>);
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('handles loading state correctly with aria-busy attribute', () => {
    render(<LoadingButton>Submit</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent(/loading/i);
  });

  it('handles disabled prop correctly', () => {
    render(<Button disabled>Disabled Action</Button>);
    const btn = screen.getByRole('button', { name: /disabled action/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });
});
