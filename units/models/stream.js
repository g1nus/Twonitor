const mongoose = require('mongoose');

const tunitSchema = new mongoose.Schema({
  viewers: {type: String},
  title: {type: String}
})

const streamSchema = new mongoose.Schema({
  streamId: {type: String},
  streamerId: {type: String},
  title: {type: String},
  startedAt: {type: String},
  tunits: [tunitSchema]
})

module.exports = {streamSchema};