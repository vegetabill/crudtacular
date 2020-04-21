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
    return [...this._columnMap.values()].filter(
      (column) => column.constructor === ForeignKeyColumn
    );
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
