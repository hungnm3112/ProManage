const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthService {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  }

  // Generate password reset token
  generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    return { resetToken, hashedToken };
  }

  // Verify user credentials
  async verifyCredentials(email, password) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    return user;
  }

  // Register new user
  async register(userData) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  // Login user
  async login(email, password) {
    const user = await this.verifyCredentials(email, password);
    const token = this.generateToken(user);

    return { user, token };
  }

  // Get user by token
  async getUserByToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return user;
  }
}

module.exports = new AuthService();
