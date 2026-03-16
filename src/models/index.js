/**
 * Models Index
 * 
 * Preload all Mongoose models to ensure they are registered
 * before any controller/service tries to use them
 */

const Employee = require('./Employee');
const GroupUser = require('./GroupUser');
const Brand = require('./Brand');

module.exports = {
  Employee,
  GroupUser,
  Brand
};
