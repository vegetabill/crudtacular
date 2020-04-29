const Joi = require('@hapi/joi');
const Column = require('./column');

class IntegerColumn extends Column {
  get joiType() {
    return Joi.number().integer();
  }
}

module.exports = IntegerColumn;
