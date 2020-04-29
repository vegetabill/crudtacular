const Column = require('./column');
const DateColumn = require('./date-column');
const IntegerColumn = require('./integer-column');

const typeToConstructor = new Map([
  ['date', DateColumn],
  ['integer', IntegerColumn]
]);

function createColumn(tableName, name, type, nullable) {
  const Clazz = typeToConstructor.get(type) || Column;
  return new Clazz(tableName, name, type, nullable);
}

module.exports = { createColumn };
