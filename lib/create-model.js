const bookshelf = require('bookshelf');

function createModel(bookshelf, { tableName, modelName, ...options }) {
  return bookshelf.model(modelName, { tableName });
}

module.exports = createModel;
