const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Project = require('../models/Project');
const MeetingRequest = require('../models/MeetingRequest');
const { generateUniqueId } = require('../utils/idGenerator');

// Load environment variables
dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB.');

    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await User.find({ userId: { $exists: false } });
    for (const user of users) {
      user.userId = await generateUniqueId('USR', User, 'userId');
      await user.save();
    }
    console.log(`Migrated ${users.length} users.`);

    // 2. Migrate Projects
    console.log('Migrating Projects...');
    // We need to fetch all projects that either lack projectId or have an ObjectId in owner (needs mapping to ownerId)
    // Because owner field was removed and replaced with ownerId, old documents will still have owner in the DB.
    const projects = await Project.find();
    for (const project of projects) {
      let needsSave = false;
      
      if (!project.projectId) {
        project.projectId = await generateUniqueId('PRJ', Project, 'projectId');
        needsSave = true;
      }

      // If ownerId doesn't exist, we must derive it from the old owner field.
      // Note: Mongoose might hide the old field if it's removed from schema, 
      // but we can access it using project.get('owner')
      const oldOwner = project.get('owner');
      if (!project.ownerId && oldOwner) {
        // Find user by old ObjectId
        const ownerDoc = await User.findById(oldOwner);
        if (ownerDoc) {
          project.ownerId = ownerDoc.userId;
          needsSave = true;
          // Note: you may also want to project.set('owner', undefined) to clean up
        }
      }

      if (needsSave) {
        await project.save();
      }
    }
    console.log(`Migrated projects.`);

    // 3. Migrate Meeting Requests
    console.log('Migrating Meeting Requests...');
    const requests = await MeetingRequest.find();
    for (const request of requests) {
      let needsSave = false;

      if (!request.requestId) {
        request.requestId = await generateUniqueId('REQ', MeetingRequest, 'requestId');
        needsSave = true;
      }

      const oldRequester = request.get('requester');
      if (!request.requesterId && oldRequester) {
        const reqDoc = await User.findById(oldRequester);
        if (reqDoc) { request.requesterId = reqDoc.userId; needsSave = true; }
      }

      const oldRecipient = request.get('recipient');
      if (!request.recipientId && oldRecipient) {
        const recDoc = await User.findById(oldRecipient);
        if (recDoc) { request.recipientId = recDoc.userId; needsSave = true; }
      }

      const oldProject = request.get('project');
      if (!request.projectId && oldProject) {
        const projDoc = await Project.findById(oldProject);
        if (projDoc) { request.projectId = projDoc.projectId; needsSave = true; }
      }

      if (needsSave) {
        await request.save();
      }
    }
    console.log(`Migrated meeting requests.`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
