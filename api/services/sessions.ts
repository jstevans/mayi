import express, { Application, Request } from 'express';
import crypto from 'node:crypto';
import { getUsers } from './users';
const router = express.Router();

type Session = { user: string; start: Date };
type SessionsStore = Record<string, Session>;

function setSessions(app: Application) {
  return app.set('sessions', {});
}

function getSessions(app: Application): SessionsStore {
  return app.get('sessions');
}

function hashPassword(
  password: string,
  salt: Buffer = crypto.randomBytes(128),
) {
  if (!password || !salt) {
    return null;
  }
  return {
    salt,
    hash: crypto.pbkdf2Sync(
      password.normalize(),
      salt,
      20000,
      2048,
      'blake2b512',
    ),
  };
}

interface LoginRequest extends Request {
  body: Record<string, string>;
}
router.post('/', function (req: LoginRequest, res, next) {
  const users = getUsers(req.app);
  const sessions = getSessions(req.app);

  const { username, password } = req.body;
  const user = users[username];
  const calculatedHash = hashPassword(password, user?.salt);
  if (!user || !calculatedHash || calculatedHash.hash == user.hash) {
    res.status(403).send('Username and password not found');
    return;
  }

  const sessionId = crypto.randomUUID();
  sessions[sessionId] = {
    user: username,
    start: new Date(),
  };

  res
    .cookie('sessionId', sessionId, {
      secure: true,
      signed: true,
      sameSite: 'strict',
    })
    .send();
});

router.delete('/', function (req, res, next) {
  const sessions = getSessions(req.app);

  const sessionId = req.signedCookies['sessionId'];
  if (!sessionId) {
    res.status(403).send('No valid session found');
    return;
  }

  delete sessions[sessionId];

  res
    .clearCookie('sessionId', {
      secure: true,
      signed: true,
      sameSite: 'strict',
    })
    .send();
});

export { router, Session, SessionsStore, setSessions, getSessions };
