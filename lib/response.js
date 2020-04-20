class Response {
  constructor(status, body, headerMap) {
    this._status = status || 200;
    this._body = body || null;
    this._headerMap = headerMap || new Map();
  }

  get headers() {
    return this._headerMap;
  }

  get body() {
    return this._body;
  }

  get status() {
    return this._status;
  }

  notFound() {
    return this.withStatus(404);
  }

  ok(data) {
    return this.withBody(data);
  }

  withHeader(name, value) {
    const headers = new Map(this._headerMap);
    headers.set(name, value);
    return new this.constructor(this.status, this.body, headers);
  }

  withStatus(status) {
    return new this.constructor(status, this.body, this.headers);
  }

  withBody(body) {
    return new this.constructor(this.status, body, this.headers);
  }

  write(expressRes) {
    expressRes.status(this.status);
    this.headers.forEach((name, value) => {
      expressRes.set(name, value);
    });
    if (this.body) {
      expressRes.send(this.body);
    } else {
      expressRes.end();
    }
  }
}

module.exports = Response;
