const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {type: String},
  message: {type: String}
})

const chatSchema = new mongoose.Schema({
  streamId: {type: String},
  messages: [messageSchema]
});

module.exports = {chatSchema};