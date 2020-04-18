const { Router } = require('express');
const chalk = require('chalk');
const Response = require('./response');
const { IndexRouteHandler, ShowRouteHandler } = require('./route-handlers');

const HANDLER_HEADER = 'X-Crudtastic-Handler';

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
      const handler = new HandlerClass({
        ctx: req.context,
        log: req.log,
        params: mergedParams,
        res: new Response(res),
        Model: this.Model
      });
      const railsStyleControllerAction = `${this.modelName}#${handler.name}`;
      req.log(railsStyleControllerAction, 'black', 'yellow');
      res.set(HANDLER_HEADER, railsStyleControllerAction);
      handler.handle();
    };
  }

  findByIdMiddleware(Model, req, res, next, id) {
    new Model({ id })
      .fetch()
      .then((r) => {
        req.context.resource = r;
        next();
      })
      .catch(() => {
        res.set(HANDLER_HEADER, `${this.modelName}#findByIdMiddleware`);
        res.sendStatus(404);
      });
  }

  attach(app) {
    const router = Router();
    const idParamName = `${this.modelName}_id`.toLowerCase();
    const indexPath = `/${this.tableName}`;
    const path = `/:${idParamName}`;

    router.get('/', this.useHandler(IndexRouteHandler));
    router.get(path, this.useHandler(ShowRouteHandler));
    // router.delete(path, this.createHandler('destroy'));
    // router.head(path, this.createHandler('exists'));

    console.log(`${chalk.cyanBright(indexPath)}`);
    const verbs = ['GET'].join(',');
    console.log(`\t${path} ${chalk.grey(verbs)}`);

    router.param(idParamName, this.findByIdMiddleware.bind(this, this.Model));

    this._resource.foreignKeys.forEach((fk) => {});

    app.use(indexPath, router);
  }
}

module.exports = ResourceRouter;
