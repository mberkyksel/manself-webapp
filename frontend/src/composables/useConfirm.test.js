import { describe, expect, it } from 'vitest';
import { useConfirm } from './useConfirm.js';

describe('useConfirm', () => {
  it('resolves true when confirmed and clears the dialog', async () => {
    const { confirm, answer, pending } = useConfirm();
    const result = confirm({ title: 'Delete?' });

    expect(pending.value).toMatchObject({ title: 'Delete?', confirmLabel: 'Confirm', cancelLabel: 'Cancel', tone: 'danger' });
    answer(true);

    expect(await result).toBe(true);
    expect(pending.value).toBeNull();
  });

  it('resolves false when cancelled', async () => {
    const { confirm, answer } = useConfirm();
    const result = confirm({ title: 'Delete?', confirmLabel: 'Delete task' });
    answer(false);
    expect(await result).toBe(false);
  });

  it('treats a new request as a "no" to the one still open', async () => {
    const { confirm, answer, pending } = useConfirm();
    const first = confirm({ title: 'First' });
    const second = confirm({ title: 'Second' });

    expect(await first).toBe(false);
    expect(pending.value.title).toBe('Second');

    answer(true);
    expect(await second).toBe(true);
  });

  it('ignores an answer when nothing is open', () => {
    const { answer, pending } = useConfirm();
    expect(() => answer(true)).not.toThrow();
    expect(pending.value).toBeNull();
  });
});
