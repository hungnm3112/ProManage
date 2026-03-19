const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const brandRoutes = require('./brandRoutes');
const broadcastRoutes = require('./broadcastRoutes');
const storeTaskRoutes = require('./storeTaskRoutes');
const userTaskRoutes = require('./userTaskRoutes');
const reviewRoutes = require('./reviewRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');
const uploadRoutes = require('./uploadRoutes');
const devRoutes = require('./devRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/brands', brandRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/store-tasks', storeTaskRoutes);
router.use('/my-tasks', userTaskRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

// Development tools (only in dev environment)
router.use('/dev', devRoutes);

module.exports = router;
