const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  streamId: {type: String},
  streamerId: {type: String},
  title: {type: String},
  startedAt: {type: String}
})

module.exports = {streamSchema};