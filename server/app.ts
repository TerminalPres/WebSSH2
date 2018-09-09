// app.js

import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as readConfig from 'read-config';
import * as core from 'express-serve-static-core';

// configPath = path.join(__dirname, 'config.json')
const nodeRoot = path.dirname(require.main.filename);
const configPath: string = path.join(nodeRoot, 'config.json');
const publicPath = path.join(nodeRoot, 'client', 'public');

console.debug('WebSSH2 service reading config from:', configPath, ';');
const config = readConfig(configPath);

const session = require('express-session')({
  secret: config.session.secret,
  name: config.session.name,
  resave: true,
  saveUninitialized: false,
  unset: 'destroy'
});
const app: core.Express = express();
const compression = require('compression');
const server = require('http').Server(app);
const myutil = require('./util');
const validator = require('validator');
const io = require('socket.io')(server, { serveClient: false });
const socket = require('./socket');
const expressOptions = require('./expressOptions');

// express
app.use(compression({ level: 9 }));
app.use(session);
app.use(myutil.basicAuth);
if (config.accesslog) app.use(logger('common'));
app.disable('x-powered-by');

// static files
app.use(express.static(publicPath, expressOptions));

app.get('/reauth', (req, res, next) => {
  const r = req.headers.referer || '/';
  res.status(401).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=' + r + '"></head><body bgcolor="#000"></body></html>');
});

app.get('/ssh/host/:host?', (req, res, next) => {
  res.sendFile(path.join(path.join(publicPath, 'client.htm')));
  // capture, assign, and validated constiables
  req.session.ssh = {
    host: (validator.isIP(req.params.host + '') && req.params.host) ||
      (validator.isFQDN(req.params.host) && req.params.host) ||
      (/^(([a-z]|[A-Z]|[0-9]|[!^(){}\-_~])+)?\w$/.test(req.params.host) &&
        req.params.host) || config.ssh.host,
    port: (validator.isInt(req.query.port + '', { min: 1, max: 65535 }) &&
      req.query.port) || config.ssh.port,
    header: {
      name: req.query.header || config.header.text,
      background: req.query.headerBackground || config.header.background
    },
    algorithms: config.algorithms,
    keepaliveInterval: config.ssh.keepaliveInterval,
    keepaliveCountMax: config.ssh.keepaliveCountMax,
    term: (/^(([a-z]|[A-Z]|[0-9]|[!^(){}\-_~])+)?\w$/.test(req.query.sshterm) &&
      req.query.sshterm) || config.ssh.term,
    terminal: {
      cursorBlink: (validator.isBoolean(req.query.cursorBlink + '') ? myutil.parseBool(req.query.cursorBlink) : config.terminal.cursorBlink),
      scrollback: (validator.isInt(req.query.scrollback + '', {
        min: 1,
        max: 200000
      }) && req.query.scrollback) ? req.query.scrollback : config.terminal.scrollback,
      tabStopWidth: (validator.isInt(req.query.tabStopWidth + '', {
        min: 1,
        max: 100
      }) && req.query.tabStopWidth) ? req.query.tabStopWidth : config.terminal.tabStopWidth,
      bellStyle: ((req.query.bellStyle) && (['sound', 'none'].indexOf(req.query.bellStyle) > -1)) ? req.query.bellStyle : config.terminal.bellStyle
    },
    allowreplay: config.options.challengeButton || (validator.isBoolean(req.headers.allowreplay + '') ? myutil.parseBool(req.headers.allowreplay) : false),
    allowreauth: config.options.allowreauth || false,
    mrhsession: ((validator.isAlphanumeric(req.headers.mrhsession + '') && req.headers.mrhsession) ? req.headers.mrhsession : 'none'),
    serverlog: {
      client: config.serverlog.client || false,
      server: config.serverlog.server || false
    },
    readyTimeout: (validator.isInt(req.query.readyTimeout + '', { min: 1, max: 300000 }) &&
      req.query.readyTimeout) || config.ssh.readyTimeout
  };
  if (req.session.ssh.header.name) validator.escape(req.session.ssh.header.name);
  if (req.session.ssh.header.background) validator.escape(req.session.ssh.header.background);
});

// express error handling
app.use((req, res, next) => {
  res.status(404).send('Sorry can\'t find that!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// socket.io
// expose express session with socket.request.session
io.use((socket, next) => {
  (socket.request.res) ? session(socket.request, socket.request.res, next)
    : next(next);
});

// bring up socket
io.on('connection', socket);

module.exports = { server: server, config: config };
