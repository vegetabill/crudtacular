function requestContext(req, _, next) {
  req.context = req.context || {};
  next();
}

module.exports = requestContext;
