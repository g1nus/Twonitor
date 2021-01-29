const mongoose = require('mongoose');
require('dotenv').config();

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_ADDRESS}/twdata?poolSize=20&writeConcern=majority`;

const {chatSchema} = require('./chat');

const connectDb = function () {
  return mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
}

const disconnectDb = function () {
  return mongoose.connection.close();
}

module.exports = {
  Chat: mongoose.model('Chat', chatSchema),
  connectDb,
  disconnectDb
}