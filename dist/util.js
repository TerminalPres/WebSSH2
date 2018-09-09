"use strict";
// util.js
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// private
require('colors'); // allow for color property extensions in log messages
const debug = require('debug')('WebSSH2');
const Auth = __importStar(require("basic-auth"));
exports.basicAuth = (req, res, next) => {
    const myAuth = Auth(req);
    if (myAuth) {
        req.session.username = myAuth.name;
        req.session.userpassword = myAuth.pass;
        debug('myAuth.name: ' + myAuth.name.yellow.bold.underline +
            ' and password ' + ((myAuth.pass) ? 'exists'.yellow.bold.underline
            : 'is blank'.underline.red.bold));
        next();
    }
    else {
        res.statusCode = 401;
        debug('basicAuth credential request (401)');
        res.setHeader('WWW-Authenticate', 'Basic realm="WebSSH"');
        res.end('Username and password required for web SSH service.');
    }
};
// takes a string, makes it boolean (true if the string is true, false otherwise)
exports.parseBool = (str) => str.toLowerCase() === 'true';
//# sourceMappingURL=util.js.map