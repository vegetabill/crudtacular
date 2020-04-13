const express = require('express');
const chalk = require('chalk');
const morgan = require('morgan');
const morganBody = require('morgan-body');
const bodyParser = require('body-parser');
const knex = require('knex');
const bookshelf = require('bookshelf');
const bookshelfModelBase = require('bookshelf-modelbase');
const { inferNames } = require('./util');

const DEFAULTS = {
  port: process.env.PORT || 3000,
  applicationName: 'REST API powered by crudtastic',
  verifyDatabase: true,
  morganFormat: 'dev',
  logBody: true
};

function createModel(ModelBase, controllerClass, config) {
  const { tableName } = inferNames(controllerClass);
  return ModelBase.extend({
    tableName,
    ...config
  });
}

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
    this.ModelBase = bookshelfModelBase(this.bookshelf);
    this.config = {
      ...DEFAULTS,
      ...config
    };
  }

  configure() {
    this.app.use(bodyParser.json());
    this.app.use(morgan(this.config.morganFormat));
    if (this.config.logBody) {
      morganBody(this.app);
    }
  }

  /**
   * @param {} controllerClass
   *    Subclass of crudtastic.Controller
   * @param {*} modelConfig 
   *    See options in https://github.com/bsiddiqui/bookshelf-modelbase

   */
  register(controllerClass, modelConfig) {
    const model = createModel(this.ModelBase, controllerClass, modelConfig);
    const controller = new controllerClass(model);
    this.app.use(`/${model.tableName}`, controller.buildRouter());
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
    // this.app.get('/ping', (req, res, next) => {
    //   const { deep } = req.query.deep;
    //   if (!deep) {
    //     res.sendStatus(200);
    //   } else {
    //   }
    // });

    this.app.listen(this.config.port, () => {
      // Freeze so someone doesn't try to add middleware or controllers after it's too late
      Object.freeze(this);
      console.log(
        chalk.green(
          `${this.config.applicationName} listening on port ${this.config.port}`
        )
      );
    });
  }
}

module.exports = Server;
