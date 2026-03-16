const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../validators/userValidator');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
