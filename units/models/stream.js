const mongoose = require('mongoose');

const tunitSchema = new mongoose.Schema({
  followers: {type: String},
  viewers: {type: String},
  title: {type: String}
}, { timestamps: true })

const streamSchema = new mongoose.Schema({
  streamId: {type: String},
  streamerId: {type: String},
  title: {type: String},
  startedAt: {type: String},
  eventList: {type: mongoose.Schema.Types.ObjectId, ref: 'EventList'},
  tunits: [tunitSchema]
}, { timestamps: true })

module.exports = {streamSchema};