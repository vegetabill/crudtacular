const express = require('express');
const chalk = require('chalk');
const bluebird = require('bluebird');

// see https://bookshelfjs.org/api.html#Model-instance-count
require('pg').defaults.parseInt8 = true;
const knex = require('knex');

const { version } = require('../package.json');
const Schema = require('./schema/schema');
const RestfulResource = require('./restful-resource');
const ResourceRouter = require('./resource-router');

const isProd = process.env.NODE_ENV === 'production';

class Server {
  static CONFIG_DEFAULTS = {
    port: process.env.PORT || 3000,
    applicationName: 'My REST API (override in config.applicationName)',
    logBody: !isProd,
    stackTrace500: !isProd,
    verbose: !isProd
  };

  /**
   * Create a new instance of Server
   * with optional config. Config is merged
   * with defaults so all keys are optional
   * except dbUrl;
   * @param { dbUrl: 'String' } config
   */
  constructor(config) {
    this.app = express();
    const { dbUrl } = config;
    if (!dbUrl) {
      throw new Error(`No dbUrl provided in ${JSON.stringify(config)}`);
    }
    this.db = knex({
      client: 'pg',
      connection: dbUrl
    });
    this.schema = new Schema(this.db);
    this.config = {
      ...Server.CONFIG_DEFAULTS,
      ...config
    };
    this.configureMiddleware();
    this.log(chalk.whiteBright(this.config.applicationName));
  }

  log(msg, force = false) {
    if (this.config.verbose) {
      const tag = chalk.magentaBright(`[crudtastic v${version}]`);
      console.log(`${tag} ${msg}`);
    }
  }

  configureMiddleware() {
    const morganBody = require('morgan-body');
    const bodyParser = require('body-parser');
    const compression = require('compression');
    const requestId = require('./middleware/request-id');
    const attachLogger = require('./middleware/attach-logger');
    const { app, config } = this;
    [
      requestId,
      attachLogger,
      bodyParser.json(),
      compression
    ].forEach((middleware) => app.use(middleware));
    const { logBody, stackTrace500 } = config;
    if (stackTrace500) {
      app.use(require('errorhandler'));
    }
    if (logBody) {
      morganBody(app);
    }
  }

  /**
   * Add any custom middleware, before calling listen()
   * See https://expressjs.com/en/guide/writing-middleware.html
   * @param {Function} middleware
   */
  use(middleware) {
    this.app.use(middleware);
  }

  listen() {
    return this.schema
      .introspect()
      .then((tables) => {
        return bluebird.map(tables, (table) => {
          const resource = new RestfulResource(table);
          return new ResourceRouter(resource);
        });
      })
      .then((routers) => {
        bluebird
          .map(routers, (r) => {
            r.attach(this.app);
            return bluebird.props({
              [r.tableName]: r.verifyDb()
            });
          })
          .then((counts) => {
            console.log('existing record counts:');
            counts.forEach((count) => console.log(count));
            const { port } = this.config;
            this.log(`👂 listening on port ${chalk.cyanBright(port)}`, true);
            return this.app.listen(port, () => {
              this.log(chalk.greenBright('READY!'));
            });
          });
      });
  }
}

module.exports = Server;
