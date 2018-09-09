// util.js

// private
require('colors'); // allow for color property extensions in log messages
const debug = require('debug')('WebSSH2');
import * as Auth from 'basic-auth';

export const basicAuth = (req, res, next) => {
  const myAuth = Auth(req);
  if (myAuth) {
    req.session.username = myAuth.name;
    req.session.userpassword = myAuth.pass;
    debug('myAuth.name: ' + myAuth.name.yellow.bold.underline +
      ' and password ' + ((myAuth.pass) ? 'exists'.yellow.bold.underline
        : 'is blank'.underline.red.bold));
    next();
  } else {
    res.statusCode = 401;
    debug('basicAuth credential request (401)');
    res.setHeader('WWW-Authenticate', 'Basic realm="WebSSH"');
    res.end('Username and password required for web SSH service.');
  }
};

// takes a string, makes it boolean (true if the string is true, false otherwise)
export const parseBool = (str: string) =>
  str.toLowerCase() === 'true';
