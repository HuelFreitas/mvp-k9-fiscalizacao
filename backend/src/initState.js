import { defaultState } from './data/defaultState.js';
import bcrypt from 'bcryptjs';

export function initAppState() {
  global.appState = JSON.parse(JSON.stringify(defaultState));
  const demoPassword = process.env.DEMO_DEFAULT_PASSWORD || '123456';
  for (const user of global.appState.users) {
    if (!user.passwordHash) {
      user.passwordHash = bcrypt.hashSync(demoPassword, 10);
    }
  }
  // store a default appUser for easy testing
  global.appUser = global.appState.users[0];
}
