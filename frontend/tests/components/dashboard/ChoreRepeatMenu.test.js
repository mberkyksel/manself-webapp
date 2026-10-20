import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../../../src/services/choreService.js', () => ({ choreService: { get: vi.fn(), save: vi.fn() } }));

const { default: ChoreRepeatMenu } = await import('../../../src/components/dashboard/ChoreRepeatMenu.vue');
const { useChoreStore } = await import('../../../src/stores/choreStore.js');
const { useChoreRepeatMenu } = await import('../../../src/composables/useChoreRepeatMenu.js');

// Wed 7 Oct 2026.
const TODAY = '2026-10-07';

let wrapper;
let store;
let trigger;

async function openMenu() {
  useChoreRepeatMenu().open({ dateKey: TODAY, choreId: 'c1', x: 100, y: 100, trigger });
  await nextTick();
  await nextTick();
}

const radios = () => [...document.querySelectorAll('[role="menuitemradio"]')];
const chips = () => [...document.querySelectorAll('[role="menuitemcheckbox"]')];
const checkedLabel = () => radios().find((r) => r.getAttribute('aria-checked') === 'true')?.textContent.trim();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
  setActivePinia(createPinia());
  store = useChoreStore();
  store.addChore(TODAY, { id: 'c1', type: 'trash', state: 'grey' });
  trigger = document.createElement('button');
  document.body.appendChild(trigger);
  wrapper = mount(ChoreRepeatMenu, { attachTo: document.body });
});

afterEach(() => {
  useChoreRepeatMenu().close();
  wrapper.unmount();
  trigger.remove();
  vi.useRealTimers();
});

describe('ChoreRepeatMenu', () => {
  it('is not shown until opened', () => {
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('lists the choices for the weekday of the badge, with "Doesn\'t repeat" checked', async () => {
    await openMenu();

    expect(radios().map((r) => r.textContent.trim())).toEqual([
      "Doesn't repeat",
      'Every day',
      'Every Wednesday',
      'Every 2 weeks on Wednesday',
      'Every month on the 7th',
    ]);
    expect(checkedLabel()).toBe("Doesn't repeat");
  });

  it('moves focus into the menu and picking a choice sets the rule, closes, and returns focus', async () => {
    await openMenu();
    expect(document.activeElement).toBe(radios()[0]);

    radios()[3].click();
    await nextTick();

    expect(store.repeatLabelOf(store.choresByDate[TODAY][0])).toBe('Every 2 weeks on Wednesday');
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('checks the current rule when reopened, and "Doesn\'t repeat" turns it off', async () => {
    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'daily', interval: 1 });
    await openMenu();
    expect(checkedLabel()).toBe('Every day');

    radios()[0].click();
    await nextTick();

    expect(store.recurringSeries).toEqual({});
  });

  it('spells a custom rule out under the weekday chips instead of adding a row', async () => {
    store.setChoreRepeat(TODAY, 'c1', { recurrence: 'weekly', interval: 1, weekdays: [2, 4] });
    await openMenu();

    expect(radios()).toHaveLength(5);
    expect(checkedLabel()).toBeUndefined();
    expect(document.querySelector('.repeat-menu__custom').textContent.trim()).toBe('Every week on Tue, Thu');
  });

  it('weekday chips build a weekly rule, stay open, and keep at least one day', async () => {
    await openMenu();
    expect(chips().map((c) => c.getAttribute('aria-label'))).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);

    chips()[1].click(); // Tuesday
    await nextTick();
    chips()[3].click(); // Thursday
    await nextTick();

    expect(store.recurringSeries[Object.keys(store.recurringSeries)[0]].weekdays).toEqual([2, 4]);
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    expect(chips().filter((c) => c.getAttribute('aria-checked') === 'true')).toHaveLength(2);

    chips()[1].click();
    await nextTick();
    chips()[3].click(); // would leave no day: ignored
    await nextTick();
    expect(store.recurringSeries[Object.keys(store.recurringSeries)[0]].weekdays).toEqual([4]);
  });

  it('closes on Escape and returns focus to the badge', async () => {
    await openMenu();

    document.querySelector('[role="menu"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();

    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('moves between choices with the arrow keys, wrapping round', async () => {
    await openMenu();
    const press = (key) =>
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

    press('ArrowDown');
    expect(document.activeElement).toBe(radios()[1]);
    press('ArrowUp');
    press('ArrowUp');
    expect(document.activeElement).toBe(chips().at(-1));
    press('Home');
    expect(document.activeElement).toBe(radios()[0]);
  });

  it('closes when clicking elsewhere', async () => {
    await openMenu();

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();

    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes if the chore is removed while it is open', async () => {
    await openMenu();

    store.removeChore(TODAY, 'c1');
    await nextTick();

    expect(document.querySelector('[role="menu"]')).toBeNull();
  });
});
