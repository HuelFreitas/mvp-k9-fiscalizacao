import { safeTrim, uid } from './utils.js';
import { findUserByEmailRecord, insertUser } from '../db/repository.js';

export async function findUserByEmail(email) {
  if (!email) return null;
  return findUserByEmailRecord(email);
}

export async function createUser({ email, name, role, company, certification, passwordHash }) {
  const normalizedEmail = safeTrim(email).toLowerCase();
  const normalizedName = safeTrim(name);

  const user = {
    id: uid(role === 'operator' ? 'operator' : 'client'),
    role,
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
  };

  if (role === 'client') {
    user.company = safeTrim(company) || 'Organização não informada';
  } else {
    user.certification = safeTrim(certification) || 'Certificação pendente';
  }

  return insertUser(user);
}
