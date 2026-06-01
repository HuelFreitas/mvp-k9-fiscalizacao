import { safeTrim } from '../utils/string.js';
import { uid } from '../utils/misc.js';

export function findUserByEmail(email, state) {
  if (!email || !state?.users) return null;
  return state.users.find((user) => user.email === email.toLowerCase()) || null;
}

export function createUser({ email, name, role, company, certification }, state) {
  const normalizedEmail = safeTrim(email).toLowerCase();
  const normalizedName = safeTrim(name);

  const user = {
    id: uid(role === 'operator' ? 'operator' : 'client'),
    role,
    name: normalizedName,
    email: normalizedEmail,
  };

  if (role === 'client') {
    user.company = safeTrim(company) || 'Organização não informada';
  } else {
    user.certification = safeTrim(certification) || 'Certificação pendente';
  }

  state.users.push(user);
  return user;
}

export function resolveOrCreateUser({ email, name, role, company, certification }, state) {
  const normalizedEmail = safeTrim(email).toLowerCase();
  const existingUser = findUserByEmail(normalizedEmail, state);

  if (existingUser) {
    return existingUser;
  }

  return createUser({ email: normalizedEmail, name, role, company, certification }, state);
}
