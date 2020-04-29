const { upperFirst } = require('lodash');
const logger = require('./logger');

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
    this._Model = table.bookshelf.model(this._modelName, {
      tableName,
      parse: this.parse.bind(this),
      format: this.format.bind(this)
    });
    this._Model.validate = this.validate.bind(this);
    logger.info(table.inspect());
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

  parse(response) {
    logger.debug('parse => ', response);
    Object.keys(response).forEach((name) => {
      const column = this._table.getColumn(name);
      const deserializer = column.customDeserializer;
      if (deserializer) {
        const value = response[name];
        logger.debug(
          `using custom deserializer for ${column.inspect()} on '${value}' isDate? ${
            value instanceof Date
          }`
        );
        const parsed = deserializer(value);
        logger.debug(`deserialized as: ${parsed}`);
        response[name] = parsed;
      }
    });
    return response;
  }

  format(attrs) {
    logger.debug('format => ', attrs);
    Object.keys(attrs).forEach((name) => {
      const column = this._table.getColumn(name);
      const serializer = column.customSerializer;
      if (serializer) {
        const value = attrs[name];
        logger.debug(
          `using custom serializer for ${column.inspect()} on ${typeof value} '${value}`
        );
        attrs[name] = deserializer(value);
      }
    });
    return attrs;
  }

  validate(attrs, action) {
    return this._table.validate(attrs, action);
  }

  get foreignKeys() {
    return this._table.foreignKeys;
  }

  withTransaction(cb) {
    return this._table.bookshelf.transaction(cb);
  }

  verifyDb() {
    return this.Model.count();
  }
}

module.exports = RestfulResource;
