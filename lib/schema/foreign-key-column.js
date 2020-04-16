const Column = require('./column');

class ForeignKeyColumn extends Column {
  constructor(column, foreignColumn) {
    super(column);
    this._column = column;
    this._foreignColumn = foreignColumn;
  }

  get tableName() {
    return this._column.tableName;
  }

  get name() {
    return this._column.name;
  }

  get foreignColumn() {
    return this._foreignColumn;
  }

  /**
   * Match the output of \d+ in psql
   */
  inspect() {
    const origin = `${this.tableName}(${this.name})`;
    const destination = `${this.foreignColumn.tableName}(${this.foreignColumn.name})`;
    return `FOREIGN KEY ${origin} REFERENCES ${destination}`;
  }
}

module.exports = ForeignKeyColumn;
