const Maintainer = require('../models/Maintainer');
const User = require('../models/User');
const Project = require('../models/Project');

class MaintainerService {
  async getAllMaintainers() {
    const maintainers = await Maintainer.find().lean();
    const result = [];
    for (const m of maintainers) {
      const user = await User.findOne({ userId: m.userId }).select('name email -_id').lean();
      const project = await Project.findOne({ projectId: m.projectId }).select('title -_id').lean();
      result.push({
        ...m,
        user,
        project,
      });
    }
    return result;
  }

  async createMaintainer(maintainerData) {
    const maintainer = new Maintainer(maintainerData);
    return await maintainer.save();
  }
}

module.exports = new MaintainerService();

