const chalk = require('chalk');
const ForeignKeyColumn = require('./foreign-key-column');

class Table {
  constructor(name, columnMap, bookshelf) {
    this._name = name;
    this._columnMap = columnMap;
    this._bookshelf = bookshelf;
  }

  get name() {
    return this._name;
  }

  get bookshelf() {
    return this._bookshelf;
  }

  get foreignKeys() {
    return Object.values(this._columnMap).filter(
      (column) => column.constructor === ForeignKeyColumn
    );
  }

  getColumn(name) {
    return this._columnMap[name];
  }

  inspect() {
    return `
${chalk.blueBright(this.name)}
\t${Object.values(this._columnMap)
      .map((col) => chalk.greenBright(col.inspect()))
      .join('\n\t')}
`;
  }
}

module.exports = Table;
