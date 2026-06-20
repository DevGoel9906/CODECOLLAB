/**
 * services/userService.js
 *
 * User business logic.
 *
 * Security:
 * - Passwords are hashed with bcrypt (cost factor 12) before storage
 * - Passwords are NEVER returned in any method response
 * - Duplicate email detection throws a typed DUPLICATE_EMAIL error
 *   so the controller can return a friendly message without leaking DB details
 */

const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const { generateUniqueId } = require('../utils/idGenerator');

const BCRYPT_COST = 12; // Strong but reasonable — ~300ms on modern hardware

// Typed error factory
const createError = (code, message, statusCode = 400) => {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
};

class UserService {
  /**
   * Return all users. Password field is never included.
   */
  async getAllUsers() {
    return await User.find().select('-_id -__v -passwordHash').lean();
  }

  /**
   * Return a single user by custom userId. Password excluded.
   */
  async getUserById(userId) {
    return await User.findOne({ userId }).select('-_id -__v -passwordHash').lean();
  }

  /**
   * Register a new user.
   *
   * Steps:
   * 1. Check for duplicate email (before hashing — saves bcrypt work on duplicates)
   * 2. Hash password with bcrypt
   * 3. Generate unique userId
   * 4. Save to database
   * 5. Return document without password or MongoDB internals
   *
   * @throws DUPLICATE_EMAIL — email already registered
   */
  async createUser(userData) {
    const { email, password } = userData;

    // 1. Duplicate email check
    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      throw createError('DUPLICATE_EMAIL', 'An account with this email already exists. Try signing in instead.', 409);
    }

    // 2. Hash password — never store plain text
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    // 3. Generate unique user ID
    const userId = await generateUniqueId('USR', User, 'userId');

    // 4. Create and save
    const user = new User({
      ...userData,
      userId,
      passwordHash: hashedPassword,
    });
    await user.save();

    // 5. Return clean object — no password, no MongoDB internals
    const userObj = user.toObject();
    delete userObj._id;
    delete userObj.__v;
    delete userObj.passwordHash; // Hard delete — never trust .select() alone
    return userObj;
  }

  /**
   * Authenticate a user by email and password.
   * Returns user details if valid.
   */
  async authenticateUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw createError('INVALID_CREDENTIALS', 'Unable to sign in. Please check your email and password and try again.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw createError('INVALID_CREDENTIALS', 'Unable to sign in. Please check your email and password and try again.', 401);
    }

    const userObj = user.toObject();
    delete userObj._id;
    delete userObj.__v;
    delete userObj.passwordHash;
    return userObj;
  }
}

module.exports = new UserService();

