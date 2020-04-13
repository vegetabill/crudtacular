const { snakeCase } = require('lodash');
const { Router } = require('express');
const Response = require('./response');

class Controller {
  constructor({ model }) {
    this.Model = model;
  }

  createHandler(action) {
    return (req, res, next) => {
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

  modelFromId(params) {
    return new this.Model({ id: params.id });
  }

  show(params, resp) {
    return this.modelFromId(params)
      .fetch()
      .then((item) => resp.ok(item))
      .catch(() => resp.notFound());
  }

  index(_, resp) {
    return this.Model.fetchAll().then((collection) => resp.ok(collection));
  }

  destroy(params, resp) {
    return this.modelFromId(params)
      .destroy()
      .then(() => resp.ok());
  }

  buildRouter() {
    const router = Router();

    router.get('/', this.createHandler('index'));
    router.get('/:id', this.createHandler('show'));
    router.delete('/:id', this.createHandler('destroy'));

    return router;
  }
}

module.exports = Controller;
