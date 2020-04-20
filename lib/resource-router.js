const { Router } = require('express');
const chalk = require('chalk');
const Response = require('./response');
const {
  IndexRouteHandler,
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
      handler.processParams(mergedParams).then((preemptiveResponse) => {
        if (preemptiveResponse) {
          preemptiveResponse.write(res);
        } else {
          handler
            .handle()
            .then((r) => {
              r.write(res);
            })
            .catch((err) => {
              req.log(err, 'red');
              res.sendStatus(500);
            });
        }
      });
    };
  }

  attach(app) {
    const router = Router();
    const idParamName = 'id';
    const indexPath = `/${this.tableName}`;
    const path = `/:${idParamName}`;

    console.log(`${chalk.cyanBright(indexPath)}`);
    router.get('/', this.useHandler(IndexRouteHandler));

    VERBS_TO_HANDLER.forEach((Handler, verb) => {
      router[verb.toLowerCase()](path, this.useHandler(Handler));
    });
    console.log(
      `\t${path} ${chalk.grey([...VERBS_TO_HANDLER.keys()].join(','))}`
    );

    this._resource.foreignKeys.forEach((fk) => {});

    app.use(indexPath, router);
  }
}

module.exports = ResourceRouter;
