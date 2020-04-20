class GenericRouteHandler {
  constructor({ ctx, res, Model, log }) {
    this.ctx = ctx;
    this.res = res;
    this.log = log;
    this.Model = Model;
  }

  get name() {
    return this.constructor.name.replace(/RouteHandler$/, '').toLowerCase();
  }

  processParams(params) {
    this.params = params;
  }

  handle() {
    this.log(`${this.constructor.name} did not implement handle()`, 'yellow');
    return this.res.withStatus(501);
  }
}

class IndexRouteHandler extends GenericRouteHandler {
  handle() {
    return this.Model.fetchAll().then((collection) => this.res.ok(collection));
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
  ShowRouteHandler,
  DestroyRouteHandler,
  ExistsRouteHandler
};
