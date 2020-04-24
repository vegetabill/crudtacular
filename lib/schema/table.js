const chalk = require('chalk');
const Joi = require('@hapi/joi');
const { camelCase } = require('lodash');
const ForeignKeyColumn = require('./foreign-key-column');

class Table {
  constructor(name, columnMap, bookshelf) {
    this._name = name;
    this._columnMap = columnMap;
    this._bookshelf = bookshelf;
    const props = {};
    this._columnMap.forEach((column, name) => {
      props[camelCase(name)] = column.toValidator();
    });
    this._validator = Joi.object(props);
  }

  get name() {
    return this._name;
  }

  get bookshelf() {
    return this._bookshelf;
  }

  get foreignKeys() {
    return [...this._columnMap.values()].filter(
      (column) => column.constructor === ForeignKeyColumn
    );
  }

  validate(attrs, action) {
    let validator = this._validator;
    if (action) {
      validator = validator.tailor(action);
    }
    const { error } = validator.validate(attrs, { abortEarly: false });
    if (error) {
      return error.details;
    }
  }

  getColumn(name) {
    return this._columnMap.get(name);
  }

  inspect() {
    return `
${chalk.blueBright(this.name)}
\t${[...this._columnMap.values()]
      .map((col) => chalk.greenBright(col.inspect()))
      .join('\n\t')}
`;
  }
}

module.exports = Table;
