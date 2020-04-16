const bookshelf = require('bookshelf');

function createModel(bookshelf, { tableName, modelName }) {
  return bookshelf.model(modelName, { tableName });
}

module.exports = createModel;
