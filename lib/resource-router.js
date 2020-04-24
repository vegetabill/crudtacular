const { Router } = require('express');
const chalk = require('chalk');
const Response = require('./response');
const {
  IndexRouteHandler,
  CreateRouteHandler,
  ShowRouteHandler,
  DestroyRouteHandler,
  ExistsRouteHandler,
  UpdateRouteHandler
} = require('./route-handlers');
const logger = require('./logger');

const HANDLER_HEADER = 'X-Crudtastic-Handler';

const VERBS_TO_HANDLER = new Map([
  ['HEAD', ExistsRouteHandler],
  ['GET', ShowRouteHandler],
  ['DELETE', DestroyRouteHandler],
  ['PUT', UpdateRouteHandler]
]);

class ResourceRouter {
  constructor(resource) {
    this._resource = resource;
  }

  get idParamName() {
    return 'id';
  }

  get resourcePath() {
    return `/:${this.idParamName}`;
  }

  get indexPath() {
    return `/${this.tableName}`;
  }

  get Model() {
    return this._resource.Model;
  }

  get modelName() {
    return this._resource.name;
  }

  get tableName() {
    return this._resource.tableName;
  }

  verifyDb() {
    return this._resource.verifyDb();
  }

  handle({ handler, params, expressResponse, reqLogger }) {
    const { requiresTransaction } = handler;
    const doHandle = () => {
      return handler.processParams(params).then((preemptiveResponse) => {
        if (preemptiveResponse) {
          preemptiveResponse.write(expressResponse);
        } else {
          return handler.handle().then((r) => {
            r.write(expressResponse);
          });
        }
      });
    };

    const txDoHandle = () => {
      if (requiresTransaction) {
        return this._resource.withTransaction((tx) => {
          handler.useTransaction(tx);
          return doHandle();
        });
      } else {
        return doHandle();
      }
    };

    return txDoHandle().catch((err) => {
      if (requiresTransaction) {
        reqLogger.error('Rolling back transaction due to unhandled error.');
      }
      reqLogger.error(err);
      expressResponse.sendStatus(500);
    });
  }

  useHandler(HandlerClass) {
    return (req, res) => {
      const reqLogger = logger.child({ requestId: req.id });
      // merge params like Rails (who cares where they live)
      const { body, params, query } = req;
      const mergedParams = {
        ...body,
        ...params,
        ...query
      };
      const response = new Response();
      const handler = new HandlerClass({
        ctx: req.context,
        logger: reqLogger,
        res: response,
        Model: this.Model,
        urlFor: this.urlFor.bind(this)
      });
      const controllerAction = `${this.modelName}#${handler.name}`;
      reqLogger.info(chalk.yellowBright(controllerAction));
      res.set(HANDLER_HEADER, controllerAction);
      this.handle({
        handler,
        params: mergedParams,
        expressResponse: res,
        reqLogger
      });
    };
  }

  urlFor(resource) {
    const formattedPath = this.resourcePath.replace(':id', resource.id);
    return `${this.indexPath}${formattedPath}`;
  }

  attach(app) {
    const router = Router();

    logger.info(
      `${chalk.cyanBright(this.indexPath)} ${chalk.grey('GET,POST')}`
    );
    router.get('/', this.useHandler(IndexRouteHandler));
    router.post('/', this.useHandler(CreateRouteHandler));

    VERBS_TO_HANDLER.forEach((Handler, verb) => {
      router[verb.toLowerCase()](this.resourcePath, this.useHandler(Handler));
    });
    logger.info(
      `\t${this.resourcePath} ${chalk.grey(
        [...VERBS_TO_HANDLER.keys()].join(',')
      )}`
    );

    app.use(this.indexPath, router);
  }
}

module.exports = ResourceRouter;
