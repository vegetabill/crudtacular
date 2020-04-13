const shortid = require('shortid');

const HEADER_NAME = 'X-Request-Id';

// borrowed from https://github.com/floatdrop/express-request-id/blob/master/index.js
function requestIdMiddleware(req, res, next) {
  req.id = req.headers[HEADER_NAME] || shortid.generate();
  res.setHeader(HEADER_NAME, req.id);
  next();
}

module.exports = requestIdMiddleware;
