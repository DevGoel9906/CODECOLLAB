const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("CONNECTED");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

require('dotenv').config();