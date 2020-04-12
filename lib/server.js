const express = require('express');
const chalk = require('chalk');

const DEFAULTS = {
  port: process.env.PORT || 3000,
  applicationName: 'REST API powered by crudtastic',
  verifyDatabase: true
};

class Server {
  constructor(config = {}) {
    this.app = express();
    this.config = {
      ...DEFAULTS,
      ...config
    };
  }

  listen() {
    this.app.listen(this.config.port, () => {
      console.log(
        chalk.green(
          `${this.config.applicationName} listening on port ${this.config.port}`
        )
      );
    });
  }
}

module.exports = Server;
