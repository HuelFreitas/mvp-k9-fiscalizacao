import { findUserByEmail, createUser } from '../services/authService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getJwtSecret } from '../config/jwt.js';
import { validateLoginPayload, validateRegisterPayload } from '../validation/schemas.js';

export async function loginHandler(req, res) {
  const parsed = validateLoginPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const { email, password } = parsed.data;

  const user = findUserByEmail(email, global.appState);
  if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });

  const allowDevPasswordless =
    process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_PASSWORDLESS_LOGIN === 'true';

  if (!allowDevPasswordless) {
    if (!password) {
      return res.status(400).json({ error: { code: 'MISSING_PASSWORD', message: 'Senha obrigatória' } });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    }
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    }
  }

  const safeUser = { ...user };
  delete safeUser.passwordHash;
  const SECRET = getJwtSecret();
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '8h' });
  return res.json({ user: safeUser, token });
}

export async function registerHandler(req, res) {
  const parsed = validateRegisterPayload(req.body);
  if (!parsed.success) return res.status(422).json({ error: { code: 'INVALID_PAYLOAD', ...parsed.error } });
  const { email, name, role, company, certification, password } = parsed.data;

  const existing = findUserByEmail(email, global.appState);
  if (existing) return res.status(409).json({ error: { code: 'EMAIL_IN_USE' } });

  const user = createUser({ email, name, role, company, certification }, global.appState);
  user.passwordHash = await bcrypt.hash(password, 10);

  const safeUser = { ...user };
  delete safeUser.passwordHash;
  const SECRET = getJwtSecret();
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '8h' });
  return res.status(201).json({ user: safeUser, token });
}
