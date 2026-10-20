import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ChoreBadge from '../../../src/components/dashboard/ChoreBadge.vue';

const chore = { id: 'a', type: 'mop', state: null, isDone: false };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function touch(wrapper, type, x = 10, y = 10) {
  return wrapper.trigger(type, { pointerType: 'touch', clientX: x, clientY: y });
}

describe('ChoreBadge repeat menu', () => {
  it('asks for the menu on right-click, at the pointer', async () => {
    const wrapper = mount(ChoreBadge, { props: { chore } });

    await wrapper.trigger('contextmenu', { clientX: 120, clientY: 80 });

    expect(wrapper.emitted('repeat-menu')[0][0]).toMatchObject({ choreId: 'a', x: 120, y: 80 });
  });

  it('opens next to the badge when the menu key is used (no pointer position)', async () => {
    const wrapper = mount(ChoreBadge, { props: { chore }, attachTo: document.body });
    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({ left: 40, bottom: 66 });

    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 });

    expect(wrapper.emitted('repeat-menu')[0][0]).toMatchObject({ x: 40, y: 66 });
    wrapper.unmount();
  });

  it('opens on a touch long-press and does not tick the chore off when the finger lifts', async () => {
    const wrapper = mount(ChoreBadge, { props: { chore } });

    await touch(wrapper, 'pointerdown', 30, 50);
    await vi.advanceTimersByTimeAsync(600);
    await touch(wrapper, 'pointerup');
    await wrapper.trigger('click');
    await vi.advanceTimersByTimeAsync(300);

    expect(wrapper.emitted('repeat-menu')[0][0]).toMatchObject({ choreId: 'a', x: 30, y: 50 });
    expect(wrapper.emitted('toggle')).toBeUndefined();
  });

  it('treats a short tap as a normal click', async () => {
    const wrapper = mount(ChoreBadge, { props: { chore } });

    await touch(wrapper, 'pointerdown');
    await vi.advanceTimersByTimeAsync(150);
    await touch(wrapper, 'pointerup');
    await wrapper.trigger('click');
    await vi.advanceTimersByTimeAsync(300);

    expect(wrapper.emitted('repeat-menu')).toBeUndefined();
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('cancels the long-press when the finger moves (scrolling)', async () => {
    const wrapper = mount(ChoreBadge, { props: { chore } });

    await touch(wrapper, 'pointerdown', 10, 10);
    await touch(wrapper, 'pointermove', 10, 40);
    await vi.advanceTimersByTimeAsync(700);

    expect(wrapper.emitted('repeat-menu')).toBeUndefined();
  });

  it('ignores a held mouse button (right-click covers the mouse)', async () => {
    const wrapper = mount(ChoreBadge, { props: { chore } });

    await wrapper.trigger('pointerdown', { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(700);

    expect(wrapper.emitted('repeat-menu')).toBeUndefined();
  });

  it('shows how it repeats in the tooltip and with a repeat marker', () => {
    const wrapper = mount(ChoreBadge, { props: { chore: { ...chore, repeatLabel: 'Every Tuesday' } } });

    expect(wrapper.attributes('title')).toContain('repeats: Every Tuesday');
    expect(wrapper.find('.chore-badge__repeat').exists()).toBe(true);
    expect(mount(ChoreBadge, { props: { chore } }).find('.chore-badge__repeat').exists()).toBe(false);
  });
});
