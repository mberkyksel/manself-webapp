import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from '../../src/composables/useToast.js';

const toast = useToast();

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  [...toast.toasts.value].forEach((t) => toast.dismiss(t.id));
  vi.useRealTimers();
});

describe('useToast', () => {
  it('shows a toast with its type and message', () => {
    toast.success('Saved.');
    expect(toast.toasts.value).toMatchObject([{ type: 'success', message: 'Saved.' }]);
  });

  it('dismisses success and info after 4s, errors after 6.5s', () => {
    toast.success('ok');
    toast.error('bad');

    vi.advanceTimersByTime(4000);
    expect(toast.toasts.value.map((t) => t.type)).toEqual(['error']);

    vi.advanceTimersByTime(2500);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('keeps a toast with an action around for 8s so there is time to click it', () => {
    toast.info('Removed.', { action: { label: 'Undo', onClick: () => {} } });

    vi.advanceTimersByTime(7999);
    expect(toast.toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('honours an explicit duration', () => {
    toast.info('quick', { duration: 500 });
    vi.advanceTimersByTime(500);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('dismisses on demand', () => {
    const id = toast.success('bye');
    toast.dismiss(id);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('shows a repeated key once and restarts its timer', () => {
    toast.error('Could not save.', { key: 'save-failed' });
    vi.advanceTimersByTime(5000);
    toast.error('Could not save (again).', { key: 'save-failed' });

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].message).toBe('Could not save (again).');

    vi.advanceTimersByTime(5000); // 10s since the first, 5s since the refresh
    expect(toast.toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(1500);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('stacks toasts that have different keys or no key', () => {
    toast.error('a', { key: 'one' });
    toast.error('b', { key: 'two' });
    toast.success('c');
    toast.success('d');
    expect(toast.toasts.value).toHaveLength(4);
  });
});
