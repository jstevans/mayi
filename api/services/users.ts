import express, { Application } from 'express';
import crypto from 'node:crypto';
const router = express.Router();

type User = { hash: Buffer; salt: Buffer };
type UsersStore = Record<string, User>;

function setUsers(app: Application) {
  return app.set('users', {});
}

function getUsers(app: Application): UsersStore {
  return app.get('users');
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

router.post('/', function (req, res, next) {
  const users = getUsers(req.app);
  const { username, password } = req.body;

  if (users[username]) {
    res.status(409).send('Username already exists');
    return;
  }

  const hashed = hashPassword(password);
  if (!hashed) {
    res.status(400).send('Bad password');
    return;
  }
  users[username] = hashed;
  res.send('Account created');
});

export { router, User, UsersStore, setUsers, getUsers };
