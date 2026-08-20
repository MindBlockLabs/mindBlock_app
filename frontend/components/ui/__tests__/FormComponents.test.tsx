import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input, PasswordInput, Textarea, Select, Checkbox, Radio } from '../FormComponents';

describe('Glassmorphism Form Components (Issue #622)', () => {
  it('renders Input with floating label and error message', () => {
    render(<Input label="Username" error="Username is required" />);
    const input = screen.getByLabelText(/username/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
  });

  it('toggles password visibility in PasswordInput', () => {
    render(<PasswordInput label="Password" defaultValue="secret123" />);
    const input = screen.getByLabelText(/password/i);
    const toggleBtn = screen.getByRole('button', { name: /show password/i });

    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders Textarea with label', () => {
    render(<Textarea label="Bio" placeholder="Tell us about yourself" />);
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
  });

  it('renders Select component with options', () => {
    const options = [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
    ];
    render(<Select label="Language" options={options} />);
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument();
  });

  it('renders Checkbox and Radio controls', () => {
    render(
      <>
        <Checkbox label="Accept Terms" />
        <Radio label="Option A" name="test" />
      </>,
    );
    expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/option a/i)).toBeInTheDocument();
  });
});
