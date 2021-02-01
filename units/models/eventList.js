const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {type: String},
  message: {type: String}
})

const wordsSchema = new mongoose.Schema({
  word: {type: String}
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

const wordCount = new mongoose.Schema({
  word: {type: String},
  count: {type: Number}
})

const chatTunitSchema = new mongoose.Schema({
  topWords: [wordCount]
})

const eventListSchema = new mongoose.Schema({
  streamId: {type: String},
  messages: [messageSchema],
  words: [String],
  chatTunits: [chatTunitSchema],
  subscriptions: [subscriptionSchema],
  raids: [raidSchema]
});

module.exports = {eventListSchema};