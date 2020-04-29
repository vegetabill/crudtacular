const chalk = require('chalk');
const Joi = require('@hapi/joi');

class Column {
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

  get customSerializer() {
    return null;
  }

  get customDeserializer() {
    return null;
  }

  get joiType() {
    return Joi.string();
  }

  toValidator() {
    return this.nullable ? this.joiType.allow(null) : this.joiType.required();
  }

  inspect() {
    return `${chalk.yellowBright(this.name)} ${this.type}${
      this.nullable ? '' : chalk.grey(' NOT NULL')
    } ${chalk.grey(this.constructor.name)}`;
  }
}

module.exports = Column;
