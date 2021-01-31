const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {type: String},
  message: {type: String}
})

const subscriptionSchema = new mongoose.Schema({
  user: {type: String},
  months: {type: Number},
  msg: {type: String},
  subPlanName: {type: String}
})

const raidSchema = new mongoose.Schema({
  user: {type: String},
  viewers: {type: Number}
})

const chatTunitSchema = new mongoose.Schema({
  topWords: [mongoose.Schema.Types.Mixed]
})

const eventListSchema = new mongoose.Schema({
  streamId: {type: String},
  messages: [messageSchema],
  chatTunits: [chatTunitSchema],
  subscriptions: [subscriptionSchema],
  raids: [raidSchema]
});

module.exports = {eventListSchema};