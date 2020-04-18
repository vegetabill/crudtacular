const bluebird = require('bluebird');
const { keyBy } = require('lodash');
const Column = require('./column');
const ForeignKeyColumn = require('./foreign-key-column');
const PrimaryKeyColumn = require('./primary-key-column');
const Table = require('./table');
const bookshelf = require('bookshelf');

/**
 * Postgres calls its namespaces 'schema' but
 * this is the more conversational concept of the database's
 * structure / DDL.
 */
class Schema {
  /**
   * @param {Object} db - a configured instance of pg
   * @param {String} schema - namespace to use, defaults to 'public'
   */
  constructor(db, schema = 'public') {
    this.db = db;
    this.bookshelf = bookshelf(db);
    this.bookshelf.plugin('bookshelf-case-converter-plugin');
    this.schema = schema;
  }

  introspect() {
    return bluebird
      .join(
        this.getTableMap(),
        this.getForeignKeys(),
        (tableMap, foreignKeys) =>
          this.wrapForeignKeyColumns(tableMap, foreignKeys)
      )
      .map(({ name, columns }) => {
        return new Table(name, columns, this.bookshelf);
      });
  }

  wrapForeignKeyColumns(tableMap, foreignKeys) {
    foreignKeys.forEach((fk) => {
      let table = tableMap[fk.origin.table];
      let column = table.columns[fk.origin.column];

      let foreignTable = tableMap[fk.destination.table];
      let foreignColumn = foreignTable.columns[fk.destination.column];

      table.columns[fk.origin.column] = new ForeignKeyColumn(
        column,
        foreignColumn
      );
    });

    return Object.values(tableMap);
  }

  getTableMap() {
    return this.getTables().then((tables) => keyBy(tables, 'name'));
  }

  getTables() {
    return bluebird.map(this.getTableNames(), (tableName) => {
      return bluebird.props({
        name: tableName,
        columns: this.getColumnMap(tableName)
      });
    });
  }

  getTableNames() {
    return this.db
      .withSchema('information_schema')
      .select('table_name')
      .from('tables')
      .where({ table_schema: this.schema })
      .then((rows) => rows.map((r) => r.table_name));
  }

  getColumnMap(tableName) {
    return bluebird.join(
      this.getColumns(tableName),
      this.getPrimaryKey(tableName),
      (columns, primaryKey) => {
        const all = keyBy(columns, 'name');
        all[primaryKey] = new PrimaryKeyColumn(all[primaryKey]);
        return all;
      }
    );
  }

  getColumns(tableName) {
    return bluebird.map(
      this.db
        .withSchema('information_schema')
        .select('column_name', 'data_type', 'is_nullable')
        .from('columns')
        .where({ table_name: tableName }),
      ({ column_name, data_type, is_nullable }) =>
        new Column(tableName, column_name, data_type, is_nullable === 'YES')
    );
  }

  getForeignKeys() {
    return bluebird.map(
      this.getKeys().where({
        constraint_type: 'FOREIGN KEY'
      }),
      (r) => {
        return {
          origin: {
            table: r.table_name,
            column: r.column_name
          },
          destination: {
            table: r.foreign_table_name,
            column: r.foreign_column_name
          }
        };
      }
    );
  }

  getPrimaryKey(tableName) {
    return this.getKeys()
      .where({
        constraint_type: 'PRIMARY KEY',
        'table_constraints.table_name': tableName
      })
      .then((rows) => {
        return rows[0]['column_name'];
      });
  }

  getKeys() {
    // Thanks to:
    // stackoverflow.com/questions/1152260/postgres-sql-to-list-table-foreign-keys
    return this.db
      .withSchema('information_schema')
      .select(
        'key_column_usage.table_name',
        'key_column_usage.column_name',
        {
          foreign_table_name: 'constraint_column_usage.table_name'
        },
        {
          foreign_column_name: 'constraint_column_usage.column_name'
        }
      )
      .from('table_constraints')
      .join(
        'key_column_usage',
        'table_constraints.constraint_name',
        'key_column_usage.constraint_name'
      )
      .join(
        'constraint_column_usage',
        'constraint_column_usage.constraint_name',
        'table_constraints.constraint_name'
      )
      .where({
        'table_constraints.table_schema': this.schema
      });
  }
}

module.exports = Schema;
