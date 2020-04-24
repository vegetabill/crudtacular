const ColumnDelegator = require('./column-delegator');
const chalk = require('chalk');

class PrimaryKeyColumn extends ColumnDelegator {
  toValidator() {
    return this.constructor.TYPE_TO_JOI.get(this.type)()
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
