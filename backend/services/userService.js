const User = require('../models/User');
const { generateUniqueId } = require('../utils/idGenerator');

class UserService {
  async getAllUsers() {
    return await User.find().select('-_id -__v -password');
  }

  async getUserById(userId) {
    return await User.findOne({ userId }).select('-_id -__v -password');
  }

  async createUser(userData) {
    const userId = await generateUniqueId('USR', User, 'userId');
    const user = new User({ ...userData, userId });
    await user.save();
    
    // Return document without internal fields
    const userObj = user.toObject();
    delete userObj._id;
    delete userObj.__v;
    delete userObj.password;
    return userObj;
  }
}

module.exports = new UserService();
