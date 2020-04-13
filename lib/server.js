const express = require('express');
const chalk = require('chalk');
const morganBody = require('morgan-body');
const bodyParser = require('body-parser');
const knex = require('knex');
const bookshelf = require('bookshelf');
const createModel = require('./create-model');
const { inferNames } = require('./util');
const requestId = require('./middleware/request-id');
const attachLogger = require('./middleware/attach-logger');

const DEFAULTS = {
  port: process.env.PORT || 3000,
  applicationName: 'REST API powered by crudtastic',
  verifyDatabase: true,
  logBody: true
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
    this.configure();
  }

  configure() {
    this.app.use(requestId);
    this.app.use(attachLogger);
    this.app.use(bodyParser.json());
    if (this.config.logBody) {
      morganBody(this.app);
    }
    console.log(chalk.whiteBright(this.config.applicationName));
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
    const controller = new controllerClass({ model });
    const route = `/${tableName}`;
    this.app.use(route, controller.buildRouter());
    console.log(`\tResource: ${chalk.blueBright(route)}`);
  }

  /**
   * Add any custom middleware
   * See https://expressjs.com/en/guide/writing-middleware.html
   * @param {Function} middleware
   */
  use(middleware) {
    this.app.use(middleware);
  }

  listen() {
    this.app.listen(this.config.port, () => {
      console.log(`listening on port ${chalk.cyanBright(this.config.port)}`);
    });
  }
}

module.exports = Server;
