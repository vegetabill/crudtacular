const Joi = require('@hapi/joi');
const moment = require('moment');
const Column = require('./column');

class DateColumn extends Column {
  get joiType() {
    return Joi.date();
  }
  get customSerializer() {
    return (obj) => obj.format('YYYY-MM-DD');
  }

  get customDeserializer() {
    return (string) => moment(string);
  }
}

module.exports = DateColumn;
