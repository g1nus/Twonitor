const mongoose = require('mongoose');
require('dotenv').config();

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_ADDRESS}/twdata?poolSize=20&writeConcern=majority`;

const {chatSchema} = require('./chat');
const {streamerSchema} = require('./streamer');
const {streamSchema} = require('./stream');

const connectDb = function () {
  console.log('connecting to database');
  return mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
}

const disconnectDb = function () {
  return mongoose.connection.close();
}

module.exports = {
  Chat: mongoose.model('Chat', chatSchema),
  Stream: mongoose.model('Stream', streamSchema),
  Streamer: mongoose.model('Streamer', streamerSchema),
  connectDb,
  disconnectDb
}