<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { CircleUserRound, KeyRound, LogOut, Mail, Trash2, UserPen, X } from '@lucide/vue';
import { useUserStore } from '../../stores/userStore.js';

const userStore = useUserStore();
const router = useRouter();

const isOpen = ref(false);

function close() {
  isOpen.value = false;
}

// --- Edit name (no password needed - it's not a credential) ---
const showNameForm = ref(false);
const nameInput = ref('');
const nameFormError = ref(null);
const nameSuccess = ref(false);

function toggleNameForm() {
  showNameForm.value = !showNameForm.value;
  nameInput.value = userStore.name;
  nameFormError.value = null;
  nameSuccess.value = false;
}

async function onUpdateName() {
  nameFormError.value = null;
  nameSuccess.value = false;

  const ok = await userStore.updateProfile({ name: nameInput.value.trim() });
  if (ok) {
    nameSuccess.value = true;
  } else {
    nameFormError.value = userStore.error;
  }
}

// --- Change password ---
const showPasswordForm = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordFormError = ref(null);
const passwordSuccess = ref(false);

function togglePasswordForm() {
  showPasswordForm.value = !showPasswordForm.value;
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  passwordFormError.value = null;
  passwordSuccess.value = false;
}

async function onChangePassword() {
  passwordFormError.value = null;
  passwordSuccess.value = false;

  if (newPassword.value.length < 8) {
    passwordFormError.value = 'New password must be at least 8 characters.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordFormError.value = 'New passwords do not match.';
    return;
  }

  const ok = await userStore.updatePassword({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
  });

  if (ok) {
    passwordSuccess.value = true;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } else {
    passwordFormError.value = userStore.error;
  }
}

// --- Change email (requires current password, like the password form) ---
const showEmailForm = ref(false);
const emailCurrentPassword = ref('');
const newEmail = ref('');
const emailFormError = ref(null);
const emailSuccess = ref(false);

function toggleEmailForm() {
  showEmailForm.value = !showEmailForm.value;
  emailCurrentPassword.value = '';
  newEmail.value = '';
  emailFormError.value = null;
  emailSuccess.value = false;
}

async function onChangeEmail() {
  emailFormError.value = null;
  emailSuccess.value = false;

  const ok = await userStore.updateEmail({
    newEmail: newEmail.value.trim(),
    currentPassword: emailCurrentPassword.value,
  });

  if (ok) {
    emailSuccess.value = true;
    emailCurrentPassword.value = '';
    newEmail.value = '';
  } else {
    emailFormError.value = userStore.error;
  }
}

// --- Delete account (irreversible: password + explicit checkbox to enable) ---
const showDeleteForm = ref(false);
const deletePassword = ref('');
const deleteConfirmed = ref(false);
const deleteFormError = ref(null);

function toggleDeleteForm() {
  showDeleteForm.value = !showDeleteForm.value;
  deletePassword.value = '';
  deleteConfirmed.value = false;
  deleteFormError.value = null;
}

async function onDeleteAccount() {
  deleteFormError.value = null;

  const ok = await userStore.deleteAccount({ currentPassword: deletePassword.value });
  if (ok) {
    router.push({ name: 'login' });
  } else {
    deleteFormError.value = userStore.error;
  }
}

function onLogout() {
  userStore.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <button type="button" class="side-panel-trigger" title="Open menu" @click="isOpen = true">
    <CircleUserRound :size="20" />
  </button>

  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="side-panel-scrim" @click="close"></div>
  </Transition>

  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="-translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="-translate-x-full opacity-0"
  >
    <aside v-if="isOpen" class="side-panel">
      <div class="side-panel__blob side-panel__blob--1" aria-hidden="true"></div>
      <div class="side-panel__blob side-panel__blob--2" aria-hidden="true"></div>

      <div class="side-panel__header">
        <span class="side-panel__title">Menu</span>
        <button type="button" class="side-panel__close" title="Close menu" @click="close">
          <X :size="16" />
        </button>
      </div>

      <template v-if="userStore.isAuthenticated">
        <p class="side-panel__user">{{ userStore.name }}</p>

        <button type="button" class="side-panel__action" @click="toggleNameForm">
          <UserPen :size="16" />
          Edit name
        </button>

        <form v-if="showNameForm" class="side-panel__form" @submit.prevent="onUpdateName">
          <input v-model="nameInput" type="text" placeholder="Name" class="side-panel__input" required />
          <p v-if="nameFormError" class="side-panel__form-error">{{ nameFormError }}</p>
          <p v-if="nameSuccess" class="side-panel__form-success">Name updated.</p>
          <button type="submit" class="side-panel__form-submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Saving…' : 'Save name' }}
          </button>
        </form>

        <button type="button" class="side-panel__action" @click="togglePasswordForm">
          <KeyRound :size="16" />
          Change password
        </button>

        <form v-if="showPasswordForm" class="side-panel__form" @submit.prevent="onChangePassword">
          <input
            v-model="currentPassword"
            type="password"
            placeholder="Current password"
            class="side-panel__input"
            required
          />
          <input
            v-model="newPassword"
            type="password"
            placeholder="New password (min 8 characters)"
            class="side-panel__input"
            required
          />
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            class="side-panel__input"
            required
          />
          <p v-if="passwordFormError" class="side-panel__form-error">{{ passwordFormError }}</p>
          <p v-if="passwordSuccess" class="side-panel__form-success">Password updated.</p>
          <button type="submit" class="side-panel__form-submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Updating…' : 'Update password' }}
          </button>
        </form>

        <button type="button" class="side-panel__action" @click="toggleEmailForm">
          <Mail :size="16" />
          Change email
        </button>

        <form v-if="showEmailForm" class="side-panel__form" @submit.prevent="onChangeEmail">
          <input
            v-model="newEmail"
            type="email"
            placeholder="New email"
            class="side-panel__input"
            required
          />
          <input
            v-model="emailCurrentPassword"
            type="password"
            placeholder="Current password"
            class="side-panel__input"
            required
          />
          <p v-if="emailFormError" class="side-panel__form-error">{{ emailFormError }}</p>
          <p v-if="emailSuccess" class="side-panel__form-success">Email updated.</p>
          <button type="submit" class="side-panel__form-submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Updating…' : 'Update email' }}
          </button>
        </form>

        <button type="button" class="side-panel__action" @click="onLogout">
          <LogOut :size="16" />
          Log out
        </button>

        <div class="side-panel__danger-zone">
          <span class="side-panel__danger-label">Danger zone</span>
          <button type="button" class="side-panel__action side-panel__action--danger" @click="toggleDeleteForm">
            <Trash2 :size="16" />
            Delete account
          </button>

          <form v-if="showDeleteForm" class="side-panel__form side-panel__form--danger" @submit.prevent="onDeleteAccount">
            <p class="side-panel__danger-warning">
              This permanently deletes your account and all boards, tasks, calendar events, and notes. This
              cannot be undone.
            </p>
            <input
              v-model="deletePassword"
              type="password"
              placeholder="Current password"
              class="side-panel__input"
              required
            />
            <label class="side-panel__danger-confirm">
              <input v-model="deleteConfirmed" type="checkbox" />
              I understand this is permanent.
            </label>
            <p v-if="deleteFormError" class="side-panel__form-error">{{ deleteFormError }}</p>
            <button
              type="submit"
              class="side-panel__form-submit side-panel__form-submit--danger"
              :disabled="userStore.loading || !deleteConfirmed"
            >
              {{ userStore.loading ? 'Deleting…' : 'Permanently delete my account' }}
            </button>
          </form>
        </div>
      </template>
    </aside>
  </Transition>
</template>

<style scoped>
.side-panel-trigger {
  @apply fixed left-4 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 text-slate-600 shadow-[0_8px_24px_-8px_rgba(30,41,59,0.35)] backdrop-blur-xl backdrop-saturate-150 transition duration-200 hover:scale-110 hover:text-indigo-600;
}
.side-panel-scrim {
  @apply fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm;
}
.side-panel {
  @apply fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto overflow-x-hidden border-r border-white/70 bg-white/70 p-5 shadow-[0_0_40px_-10px_rgba(30,41,59,0.35)] backdrop-blur-xl backdrop-saturate-150;
}
.side-panel__blob {
  @apply pointer-events-none absolute rounded-full opacity-40 blur-2xl;
}
.side-panel__blob--1 {
  @apply -left-10 -top-10 h-52 w-52 bg-indigo-400;
}
.side-panel__blob--2 {
  @apply -bottom-16 -left-6 h-48 w-48 bg-purple-400;
}
.side-panel__header {
  @apply relative z-10 flex items-center justify-between;
}
.side-panel__title {
  @apply text-xs font-semibold uppercase tracking-wide text-slate-500;
}
.side-panel__close {
  @apply flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white/60 hover:text-slate-700;
}
.side-panel__user {
  @apply relative z-10 mt-6 text-lg font-semibold text-slate-800;
}
.side-panel__action {
  @apply relative z-10 mt-2 flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-slate-600 hover:underline;
}
.side-panel__action--danger {
  @apply text-rose-400 hover:text-rose-600;
}
.side-panel__form {
  @apply relative z-10 mt-3 flex flex-col gap-2 rounded-xl border border-white/70 bg-white/60 p-3;
}
.side-panel__input {
  @apply w-full rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none;
}
.side-panel__form-error {
  @apply text-xs text-rose-600;
}
.side-panel__form-success {
  @apply text-xs text-emerald-600;
}
.side-panel__form-submit {
  @apply mt-1 rounded-lg bg-slate-800 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60;
}
.side-panel__form-submit--danger {
  @apply bg-rose-600 hover:bg-rose-700;
}
.side-panel__danger-zone {
  @apply relative z-10 mt-6 border-t border-rose-200/60 pt-3;
}
.side-panel__danger-label {
  @apply text-xs font-semibold uppercase tracking-wide text-rose-400;
}
.side-panel__form--danger {
  @apply border-rose-200/70 bg-rose-50/60;
}
.side-panel__danger-warning {
  @apply text-xs text-rose-700;
}
.side-panel__danger-confirm {
  @apply flex items-center gap-2 text-xs text-rose-700;
}
</style>
