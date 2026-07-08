import { User } from '../models/index.js';

// No authentication yet — every request operates against a single demo
// user. Replace call sites with req.user once useAuth/login is implemented.
export async function getDefaultUser() {
  const [user] = await User.findOrCreate({
    where: { email: 'demo@manself.local' },
    defaults: {
      name: 'Demo User',
      passwordHash: 'unused-until-auth-is-implemented',
    },
  });

  return user;
}
