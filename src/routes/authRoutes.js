/**
 * Authentication Routes
 * 
 * /api/auth/*
 */

const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  getMe
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login với phone + password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client xóa token)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get thông tin user hiện tại
 * @access  Private
 */
router.get('/me', authenticate, getMe);

module.exports = router;
