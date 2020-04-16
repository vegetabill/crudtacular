const ColumnDelegator = require('./column-delegator');
const chalk = require('chalk');

class PrimaryKeyColumn extends ColumnDelegator {
  inspect() {
    return chalk.magentaBright('*') + super.inspect();
  }
}

module.exports = PrimaryKeyColumn;
