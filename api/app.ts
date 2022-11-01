import * as express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { default as logger } from 'morgan';
import { router as sessionsRouter, setSessions } from './routes/sessions';
import { router as usersRouter, setUsers } from './routes/users';

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

setUsers(app);
setSessions(app);

app.use('/sessions', sessionsRouter);
app.use('/users', usersRouter);

module.exports = app;
