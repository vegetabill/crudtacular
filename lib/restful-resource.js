const { upperFirst } = require('lodash');

/**
 * Inispired heavily by:
 * https://guides.rubyonrails.org/routing.html#resource-routing-the-rails-default
 */
class RestfulResource {
  constructor(table) {
    this._table = table;
    const tableName = this.tableName;

    // maybe eventually get fancy like Rail's inflection via https://www.npmjs.com/package/pluralize
    this._modelName = upperFirst(tableName.slice(0, -1));
    this._Model = table.bookshelf.model(this._modelName, { tableName });
  }

  get name() {
    return this._modelName;
  }

  get Model() {
    return this._Model;
  }

  get tableName() {
    return this._table.name;
  }

  get foreignKeys() {
    return this._table.foreignKeys;
  }

  verifyDb() {
    return this.Model.count();
  }
}

module.exports = RestfulResource;
