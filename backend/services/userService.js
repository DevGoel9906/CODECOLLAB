const User = require('../models/User');

class UserService {
  async getAllUsers() {
    return await User.find().select('-password');
  }

  async getUserById(id) {
    return await User.findById(id).select('-password');
  }

  // Example generic service method
  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }
}

module.exports = new UserService();
