const ColumnDelegator = require('./column-delegator');
const chalk = require('chalk');
const Joi = require('@hapi/joi');

class PrimaryKeyColumn extends ColumnDelegator {
  toValidator() {
    return Joi.number()
      .integer()
      .required()
      .alter({
        create: (schema) => schema.forbidden()
      });
  }
  inspect() {
    return chalk.magentaBright('*') + super.inspect();
  }
}

module.exports = PrimaryKeyColumn;
