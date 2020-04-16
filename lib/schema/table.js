const chalk = require('chalk');

class Table {
  constructor(name, columnMap, db) {
    this._name = name;
    this._columnMap = columnMap;
    this._db = db;
  }

  get name() {
    return this._name;
  }

  /**
   * KNEX DB instance
   */
  get db() {
    return this._db;
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
