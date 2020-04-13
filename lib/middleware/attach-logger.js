const chalk = require('chalk');
const { upperFirst } = require('lodash');

function log(msg, color, bgColor) {
  const ctx = chalk.cyanBright(this.id || '-');
  if (color) {
    msg = chalk[color](msg);
  }
  if (bgColor) {
    msg = chalk[`bg${upperFirst(bgColor)}`](msg);
  }
  console.log(`[${ctx}] ${msg}`);
}

function middleware(req, _, next) {
  req.log = log.bind(req);
  next();
}

module.exports = middleware;
