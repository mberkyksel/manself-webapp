import { ref } from 'vue';

// One repeat menu at a time, opened from any chore badge:
//   const { open } = useChoreRepeatMenu();
//   open({ dateKey, choreId, x, y, trigger });
// <ChoreRepeatMenu /> (mounted once in App.vue) renders `menu`. `trigger` is
// the badge element, so focus can go back to it when the menu closes.
const menu = ref(null);

function open({ dateKey, choreId, x, y, trigger = null }) {
  menu.value = { dateKey, choreId, x, y, trigger };
}

function close() {
  menu.value = null;
}

export function useChoreRepeatMenu() {
  return { menu, open, close };
}
