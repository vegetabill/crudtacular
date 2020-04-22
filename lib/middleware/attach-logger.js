const chalk = require('chalk');
const { upperFirst } = require('lodash');
const logger = require('../logger');

function log(msg, { level = 'info', color, bgColor }) {
  const ctx = chalk.cyanBright(this.id || '-');
  if (color) {
    msg = chalk[color](msg);
  }
  if (bgColor) {
    msg = chalk[`bg${upperFirst(bgColor)}`](msg);
  }
  logger[level](`[${ctx}] ${msg}`);
}

function middleware(req, _, next) {
  req.log = log.bind(req);
  next();
}

module.exports = middleware;
