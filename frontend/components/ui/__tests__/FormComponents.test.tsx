import React from 'react';
import { Input, PasswordInput, Textarea, Select, Checkbox, Radio } from '../FormComponents';

describe('Glassmorphism Form Components (Issue #622)', () => {
  it('instantiates Input component with floating label and error message', () => {
    const el = <Input label="Username" error="Username is required" />;
    expect(el.type).toBe(Input);
    expect(el.props.label).toBe('Username');
    expect(el.props.error).toBe('Username is required');
  });

  it('instantiates PasswordInput component', () => {
    const el = <PasswordInput label="Password" defaultValue="secret123" />;
    expect(el.type).toBe(PasswordInput);
    expect(el.props.label).toBe('Password');
  });

  it('instantiates Textarea component with label', () => {
    const el = <Textarea label="Bio" placeholder="Tell us about yourself" />;
    expect(el.type).toBe(Textarea);
    expect(el.props.label).toBe('Bio');
  });

  it('instantiates Select component with options', () => {
    const options = [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
    ];
    const el = <Select label="Language" options={options} />;
    expect(el.type).toBe(Select);
    expect(el.props.options).toHaveLength(2);
  });

  it('instantiates Checkbox and Radio controls', () => {
    const checkboxEl = <Checkbox label="Accept Terms" />;
    const radioEl = <Radio label="Option A" name="test" />;

    expect(checkboxEl.type).toBe(Checkbox);
    expect(checkboxEl.props.label).toBe('Accept Terms');
    expect(radioEl.type).toBe(Radio);
    expect(radioEl.props.label).toBe('Option A');
  });
});
