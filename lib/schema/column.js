const chalk = require('chalk');

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

  inspect() {
    return `${chalk.yellowBright(this.name)} ${this.type}${
      this.nullable ? '' : chalk.grey(' NOT NULL')
    }`;
  }
}

module.exports = Column;
