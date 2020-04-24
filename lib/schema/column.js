const chalk = require('chalk');
const Joi = require('@hapi/joi');

class Column {
  static TYPE_TO_JOI = new Map([
    ['text', () => Joi.string()],
    ['integer', () => Joi.number()],
    ['date', () => Joi.date()]
  ]);

  constructor(tableName, name, type, nullable) {
    this._tableName = tableName;
    this._name = name;
    this._type = type;
    this._nullable = nullable;
  }

  get tableName() {
    return this._tableName;
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }

  get nullable() {
    return this._nullable;
  }

  toValidator() {
    const val = Column.TYPE_TO_JOI.get(this.type)();
    return this.nullable ? val.allow(null) : val.required();
  }

  inspect() {
    return `${chalk.yellowBright(this.name)} ${this.type}${
      this.nullable ? '' : chalk.grey(' NOT NULL')
    }`;
  }
}

module.exports = Column;
