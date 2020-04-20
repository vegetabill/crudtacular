class GenericRouteHandler {
  constructor({ ctx, res, Model, log }) {
    this.ctx = ctx;
    this.res = res;
    this.log = log;
    this.Model = Model;
  }

  get requiresTransaction() {
    return false;
  }

  useTransaction(tx) {
    this._tx = tx;
  }

  get name() {
    return this.constructor.name.replace(/RouteHandler$/, '').toLowerCase();
  }

  processParams(params) {
    this.params = params;
    return Promise.resolve(null);
  }

  handle() {
    throw new Error(`${this.constructor.name} did not implement handle()`);
  }
}

class IndexRouteHandler extends GenericRouteHandler {
  handle() {
    return this.Model.fetchAll().then((collection) => this.res.ok(collection));
  }
}

class CreateRouteHandler extends GenericRouteHandler {
  get requiresTransaction() {
    return true;
  }

  handle() {
    return new this.Model(this.params)
      .save({}, { transacting: this._tx })
      .then((saved) => {
        return this.res.withBody(saved).withStatus(201);
      });
  }
}

class ExistingResourceRouteHandler extends GenericRouteHandler {
  processParams(params) {
    super.processParams(params);
    return new this.Model({ id: params.id })
      .fetch()
      .then((r) => {
        this.ctx.resource = r;
      })
      .catch((err) => {
        this.log(err, 'red');
        return this.res.notFound();
      });
  }

  get resource() {
    return this.ctx.resource;
  }
}

class ShowRouteHandler extends ExistingResourceRouteHandler {
  handle() {
    return Promise.resolve(this.res.ok(this.resource));
  }
}

class ExistsRouteHandler extends GenericRouteHandler {
  processParams(params) {
    return new this.Model()
      .where('id', params.id)
      .count()
      .then((count) => (count ? this.res.ok() : this.res.notFound()));
  }

  handle() {
    return Promise.resolve(this.res.ok());
  }
}

class DestroyRouteHandler extends ExistingResourceRouteHandler {
  handle() {
    return this.resource.destroy().then(() => {
      return this.res.ok();
    });
  }
}

module.exports = {
  GenericRouteHandler,
  IndexRouteHandler,
  CreateRouteHandler,
  ShowRouteHandler,
  DestroyRouteHandler,
  ExistsRouteHandler
};
