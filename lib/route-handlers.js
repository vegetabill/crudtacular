class GenericRouteHandler {
  constructor({ ctx, res, params, Model, log }) {
    this.ctx = ctx;
    this.res = res;
    this.params = params;
    this.log = log;
    this.Model = Model;
  }

  get name() {
    return this.constructor.name.replace(/RouteHandler$/, '').toLowerCase();
  }

  handle() {
    this.log(`${this.constructor.name} did not implement handle()`, 'orange');
    this.res.notImplemented();
  }
}

class IndexRouteHandler extends GenericRouteHandler {
  handle() {
    this.Model.fetchAll().then((collection) => this.res.ok(collection));
  }
}

class ShowRouteHandler extends GenericRouteHandler {
  handle() {
    this.res.ok(this.ctx.resource);
  }
}

class DestroyRouteHandler extends GenericRouteHandler {
  handle() {
    this.ctx.resource.destroy().then(() => {
      this.res.ok();
    });
  }
}

module.exports = {
  GenericRouteHandler,
  IndexRouteHandler,
  ShowRouteHandler,
  DestroyRouteHandler
};
