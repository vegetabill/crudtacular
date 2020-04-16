const Column = require('./column');
const chalk = require('chalk');

class ColumnDelegator extends Column {
  constructor(column) {
    super(column);
    this._column = column;
  }

  get tableName() {
    return this._column.tableName;
  }

  get name() {
    return this._column.name;
  }

  inspect() {
    return `${this._column.inspect()} ${chalk.magentaBright(
      this.constructor.name.replace('Column', '')
    )}`;
  }
}

module.exports = ColumnDelegator;
