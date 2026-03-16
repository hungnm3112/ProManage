const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const brandRoutes = require('./brandRoutes');
const broadcastRoutes = require('./broadcastRoutes');
const storeTaskRoutes = require('./storeTaskRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/brands', brandRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/store-tasks', storeTaskRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;
