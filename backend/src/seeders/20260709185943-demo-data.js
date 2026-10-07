import { User } from '../models/index.js';
import { resetDemoAccount, DEMO_EMAIL } from '../services/demo.service.js';

// Same reset the "Try the demo" button triggers (POST /api/auth/demo), so
// `npm run seed` and the button always produce identical data. Re-running it
// replaces the demo account's data rather than piling up duplicates.
export async function up() {
  await resetDemoAccount();
}

export async function down() {
  // Boards, tasks, events and notes all cascade from the user.
  await User.destroy({ where: { email: DEMO_EMAIL } });
}
