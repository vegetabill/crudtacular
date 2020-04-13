class Response {
  constructor(res) {
    this.res = res;
  }

  notFound() {
    this.res.sendStatus(404);
  }

  ok(data) {
    this.res.send(data);
  }

  noContent() {
    this.res.sendStatus(204);
  }
}

module.exports = Response;
