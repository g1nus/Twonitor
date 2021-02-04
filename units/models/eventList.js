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
}, { timestamps: true })

const raidSchema = new mongoose.Schema({
  user: {type: String},
  viewers: {type: Number}
}, { timestamps: true })

const wordCount = new mongoose.Schema({
  word: {type: String},
  count: {type: Number}
})

const chatTunitSchema = new mongoose.Schema({
  topWords: [wordCount],
  createdAt: {type: Date, default: Date.now} //timestamp workaround (default mongoose option doesn't work)
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