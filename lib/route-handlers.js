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

// destroy(_, params, resp) {
//   return this.modelFromParams(params)
//     .destroy()
//     .then(() => resp.ok());
// }

// exists(params, resp) {
//   return this.modelFromParams(params)
//     .count()
//     .then((count) => (count ? resp.noContent() : resp.notFound()));
// }

module.exports = {
  GenericRouteHandler,
  IndexRouteHandler,
  ShowRouteHandler
};
