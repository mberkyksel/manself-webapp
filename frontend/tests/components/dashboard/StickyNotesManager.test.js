import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const list = vi.hoisted(() => vi.fn());
vi.mock('../../../src/services/noteService.js', () => ({
  noteService: { list, create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const { default: StickyNotesManager } = await import('../../../src/components/dashboard/StickyNotesManager.vue');

const NOTES = [{ id: 1, text: 'hello', color: 'yellow', positionX: 9999, positionY: 340, zIndex: 1 }];

// jsdom has no matchMedia; fake one that answers for a given viewport width.
function setViewportWidth(width) {
  vi.stubGlobal('matchMedia', (query) => {
    const max = Number(/max-width:\s*([\d.]+)px/.exec(query)?.[1]);
    return { matches: width <= max, addEventListener: () => {}, removeEventListener: () => {} };
  });
}

async function mountManager() {
  const wrapper = mount(StickyNotesManager, { global: { stubs: { teleport: true } } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  setActivePinia(createPinia());
  list.mockResolvedValue(NOTES);
});

afterEach(() => vi.unstubAllGlobals());

describe('StickyNotesManager layout', () => {
  it('floats the notes freely on screens 1440px wide and up', async () => {
    setViewportWidth(1440);
    const wrapper = await mountManager();

    expect(wrapper.find('.sticky-notes-layer').exists()).toBe(true);
    expect(wrapper.find('.sticky-notes-toggle').exists()).toBe(false);
  });

  it.each([390, 1024, 1366, 1439])('uses the bottom-sheet list at %ipx so notes never cover the page', async (width) => {
    setViewportWidth(width);
    const wrapper = await mountManager();

    expect(wrapper.find('.sticky-notes-layer').exists()).toBe(false);
    expect(wrapper.find('.sticky-notes-toggle').exists()).toBe(true);
  });
});
