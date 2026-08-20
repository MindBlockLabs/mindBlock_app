import React from 'react';
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
  it('instantiates PrimaryButton element correctly', () => {
    const el = <PrimaryButton>Click Me</PrimaryButton>;
    expect(el.type).toBe(PrimaryButton);
    expect(el.props.children).toBe('Click Me');
  });

  it('instantiates SecondaryButton element correctly', () => {
    const el = <SecondaryButton>Secondary</SecondaryButton>;
    expect(el.type).toBe(SecondaryButton);
    expect(el.props.children).toBe('Secondary');
  });

  it('instantiates GhostButton element correctly', () => {
    const el = <GhostButton>Ghost</GhostButton>;
    expect(el.type).toBe(GhostButton);
    expect(el.props.children).toBe('Ghost');
  });

  it('instantiates DangerButton element correctly', () => {
    const el = <DangerButton>Delete Account</DangerButton>;
    expect(el.type).toBe(DangerButton);
    expect(el.props.children).toBe('Delete Account');
  });

  it('instantiates IconButton element correctly', () => {
    const el = <IconButton aria-label="Settings">⚙️</IconButton>;
    expect(el.type).toBe(IconButton);
    expect(el.props['aria-label']).toBe('Settings');
  });

  it('instantiates LoadingButton element correctly', () => {
    const el = <LoadingButton>Submit</LoadingButton>;
    expect(el.type).toBe(LoadingButton);
    expect(el.props.isLoading).toBe(true);
  });

  it('instantiates disabled Button correctly', () => {
    const el = <Button disabled>Disabled Action</Button>;
    expect(el.type).toBe(Button);
    expect(el.props.disabled).toBe(true);
  });
});
