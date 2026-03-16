/**
 * Models Index
 * 
 * Preload all Mongoose models to ensure they are registered
 * before any controller/service tries to use them
 */

const Employee = require('./Employee');
const GroupUser = require('./GroupUser');
const Brand = require('./Brand');
const Broadcast = require('./Broadcast');
const StoreTask = require('./StoreTask');
const UserTask = require('./UserTask');
const Notification = require('./Notification');

module.exports = {
  Employee,
  GroupUser,
  Brand,
  Broadcast,
  StoreTask,
  UserTask,
  Notification
};
