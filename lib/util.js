const { snakeCase, upperFirst } = require('lodash');

function inferNames(controllerClass) {
  const tableName = snakeCase(controllerClass.name).replace(/_controller$/, '');
  const modelName = upperFirst(tableName.slice(0, -1));
  return {
    tableName,
    modelName
  };
}

module.exports = {
  inferNames
};
