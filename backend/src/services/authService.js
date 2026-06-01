import { safeTrim, uid } from './utils.js';

export function findUserByEmail(email, state) {
  if (!email || !state?.users) return null;
  return state.users.find((user) => user.email === String(email).toLowerCase()) || null;
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
