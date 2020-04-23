const chalk = require('chalk');
const Joi = require('@hapi/joi');
const ForeignKeyColumn = require('./foreign-key-column');

class Table {
  constructor(name, columnMap, bookshelf) {
    this._name = name;
    this._columnMap = columnMap;
    this._bookshelf = bookshelf;
    const props = {};
    this._columnMap.forEach((column, name) => {
      props[name] = column.toValidator();
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

  validate(attrs) {
    const { error } = this._validator.validate(attrs);
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
