const { snakeCase } = require('lodash');
const { Router } = require('express');
const chalk = require('chalk');
const Response = require('./response');

class ResourceRouter {
  constructor(resource) {
    this._resource = resource;
  }

  get Model() {
    this._resource.Model;
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

  createHandler(action) {
    return (req, res, next) => {
      req.log(`${this.modelName}#${action}`, 'black', 'yellow');
      // merge params like Rails (who cares where they live)
      const { body, params, query } = req;
      const mergedParams = {
        ...body,
        ...params,
        ...query
      };
      return this[action](mergedParams, new Response(res)).catch(next);
    };
  }

  modelFromParams(params) {
    return new this.Model({ id: params.id });
  }

  show(params, resp) {
    return this.modelFromParams(params)
      .fetch()
      .then((item) => resp.ok(item))
      .catch(() => resp.notFound());
  }

  index(_, resp) {
    return this.Model.fetchAll().then((collection) => resp.ok(collection));
  }

  destroy(params, resp) {
    return this.modelFromParams(params)
      .destroy()
      .then(() => resp.ok());
  }

  exists(params, resp) {
    return this.modelFromParams(params)
      .count()
      .then((count) => (count ? resp.noContent() : resp.notFound()));
  }

  attach(app) {
    const router = Router();
    const rootPath = '/' + this.tableName;

    console.log(`setup resource: ${chalk.cyanBright(rootPath)}`);

    router.get('/', this.createHandler('index'));
    router.get('/:id', this.createHandler('show'));
    router.delete('/:id', this.createHandler('destroy'));
    router.head('/:id', this.createHandler('exists'));

    app.use(rootPath, router);
  }
}

module.exports = ResourceRouter;
