const { snakeCase } = require('lodash');
const { Router } = require('express');
const Response = require('./response');

class Controller {
  constructor({ model, tableName, modelName }) {
    this.Model = model;
    this.tableName = tableName;
    this.modelName = modelName;
  }

  verifyDb() {
    return this.Model.count();
  }

  createHandler(action) {
    return (req, res, next) => {
      req.log(`${this.constructor.name}#${action}`, 'black', 'yellow');
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

  buildRouter() {
    const router = Router();

    router.get('/', this.createHandler('index'));
    router.get('/:id', this.createHandler('show'));
    router.delete('/:id', this.createHandler('destroy'));
    router.head('/:id', this.createHandler('exists'));

    return router;
  }
}

module.exports = Controller;
