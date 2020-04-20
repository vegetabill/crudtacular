const { Router } = require('express');
const chalk = require('chalk');
const Response = require('./response');
const {
  IndexRouteHandler,
  CreateRouteHandler,
  ShowRouteHandler,
  DestroyRouteHandler,
  ExistsRouteHandler
} = require('./route-handlers');

const HANDLER_HEADER = 'X-Crudtastic-Handler';

const VERBS_TO_HANDLER = new Map([
  ['HEAD', ExistsRouteHandler],
  ['GET', ShowRouteHandler],
  ['DELETE', DestroyRouteHandler]
]);

class ResourceRouter {
  constructor(resource) {
    this._resource = resource;
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

  handle({ handler, params, expressResponse }) {
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
      if (handler.requiresTransaction) {
        return this._resource.withTransaction((tx) => {
          handler.useTransaction(tx);
          return doHandle();
        });
      } else {
        return doHandle();
      }
    };

    return txDoHandle().catch((err) => {
      handler.log(`Rolling back tx due to ${err}`, 'red');
      expressResponse.sendStatus(500);
    });
  }

  useHandler(HandlerClass) {
    return (req, res) => {
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
        log: req.log,
        res: response,
        Model: this.Model
      });
      const controllerAction = `${this.modelName}#${handler.name}`;
      req.log(controllerAction, 'black', 'yellow');
      res.set(HANDLER_HEADER, controllerAction);
      this.handle({ handler, params: mergedParams, expressResponse: res });
    };
  }

  attach(app) {
    const router = Router();
    const idParamName = 'id';
    const indexPath = `/${this.tableName}`;
    const path = `/:${idParamName}`;

    console.log(`${chalk.cyanBright(indexPath)}`);
    router.get('/', this.useHandler(IndexRouteHandler));
    router.post('/', this.useHandler(CreateRouteHandler));

    VERBS_TO_HANDLER.forEach((Handler, verb) => {
      router[verb.toLowerCase()](path, this.useHandler(Handler));
    });
    console.log(
      `\t${path} ${chalk.grey([...VERBS_TO_HANDLER.keys()].join(','))}`
    );

    app.use(indexPath, router);
  }
}

module.exports = ResourceRouter;
