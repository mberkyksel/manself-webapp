import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../../src/services/api.js', () => ({ TOKEN_STORAGE_KEY: 'manself_token', api: {} }));
vi.mock('../../src/services/authService.js', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    demoLogin: vi.fn(),
    me: vi.fn(),
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
    updateEmail: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

const { authService } = await import('../../src/services/authService.js');
const { useUserStore } = await import('../../src/stores/userStore.js');
const { useChoreStore } = await import('../../src/stores/choreStore.js');

const USER = { id: 1, name: 'Tess', email: 'tess@example.test', timezone: 'Europe/Berlin', location: null, isDemo: false };

function serverError(message) {
  return { response: { data: { error: { message } } } };
}

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
});

describe('login', () => {
  it('stores the session and the token', async () => {
    authService.login.mockResolvedValue({ token: 'tok', user: USER });
    const store = useUserStore();

    expect(await store.login({ email: USER.email, password: 'pw' })).toBe(true);

    expect(store.isAuthenticated).toBe(true);
    expect(store.name).toBe('Tess');
    expect(localStorage.getItem('manself_token')).toBe('tok');
    expect(store.loading).toBe(false);
  });

  it("shows the server's message when it fails", async () => {
    authService.login.mockRejectedValue(serverError('Invalid email or password'));
    const store = useUserStore();

    expect(await store.login({ email: 'x', password: 'y' })).toBe(false);

    expect(store.isAuthenticated).toBe(false);
    expect(store.error).toBe('Invalid email or password');
    expect(store.loading).toBe(false);
  });

  it('falls back to a generic message when there is no server response', async () => {
    authService.login.mockRejectedValue(new Error('Network Error'));
    const store = useUserStore();
    await store.login({ email: 'x', password: 'y' });
    expect(store.error).toBe('Invalid email or password.');
  });
});

describe('session', () => {
  it('logout clears the user and the stored token', async () => {
    authService.login.mockResolvedValue({ token: 'tok', user: USER });
    const store = useUserStore();
    await store.login({ email: USER.email, password: 'pw' });

    store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(localStorage.getItem('manself_token')).toBeNull();
  });

  it('falls back to neutral values while logged out', () => {
    const store = useUserStore();
    expect(store.name).toBe('there');
    expect(store.location).toBeNull();
    expect(store.isDemo).toBe(false);
  });

  it('restores the user from a stored token, and drops a token the server rejects', async () => {
    localStorage.setItem('manself_token', 'stored');
    setActivePinia(createPinia());
    const store = useUserStore();
    authService.me.mockResolvedValueOnce({ user: USER });
    await store.fetchCurrentUser();
    expect(store.user.email).toBe(USER.email);

    authService.me.mockRejectedValueOnce(new Error('401'));
    await store.fetchCurrentUser();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('manself_token')).toBeNull();
  });
});

describe('demo login', () => {
  it('logs in, reports isDemo and seeds the browser-local chores', async () => {
    authService.demoLogin.mockResolvedValue({ token: 'demo-tok', user: { ...USER, name: 'Demo User', isDemo: true } });
    const store = useUserStore();
    const chores = useChoreStore();

    expect(await store.loginAsDemo()).toBe(true);

    expect(store.isDemo).toBe(true);
    expect(Object.keys(chores.choresByDate).length).toBeGreaterThan(0);
  });

  it('leaves the chores alone when the demo login fails', async () => {
    authService.demoLogin.mockRejectedValue(serverError('Demo mode is not enabled'));
    const store = useUserStore();
    const chores = useChoreStore();
    chores.addChore('2026-10-07', { id: 'mine', type: 'mop' });

    expect(await store.loginAsDemo()).toBe(false);

    expect(store.error).toBe('Demo mode is not enabled');
    expect(chores.choresByDate['2026-10-07']).toHaveLength(1);
  });
});

describe('account changes', () => {
  it('updateProfile sends only the given fields and keeps the new user', async () => {
    authService.updateProfile.mockResolvedValue({ user: { ...USER, location: 'Munich' } });
    const store = useUserStore();

    expect(await store.updateProfile({ location: 'Munich' })).toBe(true);

    expect(authService.updateProfile).toHaveBeenCalledWith({ location: 'Munich' });
    expect(store.location).toBe('Munich');
  });

  it('updateEmail swaps in the fresh token that comes back', async () => {
    authService.updateEmail.mockResolvedValue({ token: 'new-tok', user: { ...USER, email: 'new@example.test' } });
    const store = useUserStore();

    await store.updateEmail({ newEmail: 'new@example.test', currentPassword: 'pw' });

    expect(localStorage.getItem('manself_token')).toBe('new-tok');
    expect(store.user.email).toBe('new@example.test');
  });

  it('a failed password change reports the error and keeps the session', async () => {
    authService.login.mockResolvedValue({ token: 'tok', user: USER });
    authService.updatePassword.mockRejectedValue(serverError('Current password is incorrect'));
    const store = useUserStore();
    await store.login({ email: USER.email, password: 'pw' });

    expect(await store.updatePassword({ currentPassword: 'bad', newPassword: 'new-pass-123' })).toBe(false);

    expect(store.error).toBe('Current password is incorrect');
    expect(store.isAuthenticated).toBe(true);
  });

  it('deleting the account ends the session', async () => {
    authService.login.mockResolvedValue({ token: 'tok', user: USER });
    authService.deleteAccount.mockResolvedValue({});
    const store = useUserStore();
    await store.login({ email: USER.email, password: 'pw' });

    expect(await store.deleteAccount({ currentPassword: 'pw' })).toBe(true);
    expect(store.isAuthenticated).toBe(false);
  });
});
