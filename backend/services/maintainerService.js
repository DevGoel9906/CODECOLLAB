const Maintainer = require('../models/Maintainer');

class MaintainerService {
  async getAllMaintainers() {
    return await Maintainer.find().populate('user', 'name email').populate('project', 'title');
  }

  async createMaintainer(maintainerData) {
    const maintainer = new Maintainer(maintainerData);
    return await maintainer.save();
  }
}

module.exports = new MaintainerService();
