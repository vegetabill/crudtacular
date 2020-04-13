const express = require('express');
const chalk = require('chalk');
const morganBody = require('morgan-body');
const bodyParser = require('body-parser');
const compression = require('compression');
// see https://bookshelfjs.org/api.html#Model-instance-count
require('pg').defaults.parseInt8 = true;
const knex = require('knex');
const bookshelf = require('bookshelf');
const createModel = require('./create-model');
const { inferNames } = require('./util');
const requestId = require('./middleware/request-id');
const attachLogger = require('./middleware/attach-logger');
const { version } = require('../package.json');

const isProd = process.env.NODE_ENV === 'production';

const DEFAULTS = {
  port: process.env.PORT || 3000,
  applicationName: 'My REST API (override in config.applicationName)',
  logBody: !isProd,
  stackTrace500: !isProd,
  verbose: !isProd
};

class Server {
  /**
   * Create a new instance of Server
   * with optional config. Config is merged
   * with defaults so all keys are optional.
   * @param {} config
   */
  constructor(config = {}) {
    this.app = express();
    const { dbUrl } = config;
    if (!dbUrl) {
      throw new Error(`No dbUrl provided in ${JSON.stringify(config)}`);
    }
    this.db = knex({
      client: 'pg',
      connection: dbUrl
    });
    this.bookshelf = bookshelf(this.db);
    this.bookshelf.plugin('bookshelf-case-converter-plugin');
    this.config = {
      ...DEFAULTS,
      ...config
    };
    this.routesToController = new Map();
    this.configure();
  }

  log(msg, force = false) {
    if (this.config.verbose) {
      const tag = chalk.magentaBright(`[crudtastic v${version}]`);
      console.log(`${tag} ${msg}`);
    }
  }

  configure() {
    const { app, config } = this;
    [
      requestId,
      attachLogger,
      bodyParser.json(),
      compression
    ].forEach((middleware) => app.use(middleware));
    const { logBody, applicationName, stackTrace500 } = config;
    if (stackTrace500) {
      app.use(require('errorhandler'));
    }
    if (logBody) {
      morganBody(app);
    }
    this.log(chalk.whiteBright(applicationName));
  }

  /**
   * @param {} controllerClass
   *    Subclass of crudtastic.Controller
   * @param {*} modelConfig 
   *    See options in https://github.com/bsiddiqui/bookshelf-modelbase

   */
  register(controllerClass, modelConfig) {
    const { tableName, modelName } = inferNames(controllerClass);
    const model = createModel(this.bookshelf, {
      tableName,
      modelName,
      ...modelConfig
    });
    const controller = new controllerClass({ model, tableName, modelName });
    const route = `/${tableName}`;
    this.routesToController.set(route, controller);
    this.app.use(route, controller.buildRouter());
    this.log(`\tregistered resource: ${chalk.blueBright(route)}`);
  }

  /**
   * Add any custom middleware, before calling listen()
   * See https://expressjs.com/en/guide/writing-middleware.html
   * @param {Function} middleware
   */
  use(middleware) {
    this.app.use(middleware);
  }

  verifyDb() {
    const verifiers = [...this.routesToController.values()].map(
      (controller) => {
        return controller.verifyDb().then((msg) => this.log(msg));
      }
    );
    return Promise.all(verifiers);
  }

  listen() {
    const { port } = this.config;
    this.app.listen(port, () => {
      this.log(`👂 listening on port ${chalk.cyanBright(port)}`, true);
      this.verifyDb().then(() => {
        this.log(chalk.greenBright('READY!'));
      });
    });
  }
}

module.exports = Server;
