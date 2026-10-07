import { ref } from 'vue';

// One dialog at a time, driven from anywhere:
//   const { confirm } = useConfirm();
//   if (await confirm({ title: 'Delete task?', message: '...' })) { ... }
// <ConfirmDialog /> (mounted once in App.vue) renders `pending`.
const pending = ref(null);

function confirm({
  title,
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
} = {}) {
  // A new request while one is open counts as "no" for the old one.
  pending.value?.resolve(false);

  return new Promise((resolve) => {
    pending.value = { title, message, confirmLabel, cancelLabel, tone, resolve };
  });
}

function answer(result) {
  const current = pending.value;
  pending.value = null;
  current?.resolve(result);
}

export function useConfirm() {
  return { pending, confirm, answer };
}
