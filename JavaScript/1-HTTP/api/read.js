'use strict';

const memory = require('../memory.js');

module.exports = async (name) => {
  const shape = memory.get(name);
  if (!shape) return 'Shape is not found';
  return shape;
};
