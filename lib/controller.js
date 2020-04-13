const { snakeCase } = require('lodash');
const { Router } = require('express');
const Response = require('./response');

class Controller {
  constructor({ modelClass }) {
    this.Model = modelClass;
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

  async show(params, resp) {
    return this.Model.findById(params.id).then((model) =>
      model ? resp.ok(model) : resp.notFound()
    );
  }

  async index(_, resp) {
    return this.Model.findAll().then((collection) => resp.ok(collection));
  }

  buildRouter() {
    const router = Router();

    router.get('/', this.createHandler('index'));
    router.get('/:id', this.createHandler('show'));

    return router;
  }
}

module.exports = Controller;
