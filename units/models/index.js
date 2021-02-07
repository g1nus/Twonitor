const mongoose = require('mongoose');
require('dotenv').config();

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_ADDRESS}?poolSize=200`;

const {eventListSchema} = require('./eventList');
const {streamerSchema} = require('./streamer');
const {streamSchema} = require('./stream');

const connectDb = function () {
  return mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
}

const disconnectDb = function () {
  return mongoose.connection.close();
}

module.exports = {
  EventList: mongoose.model('EventList', eventListSchema),
  Stream: mongoose.model('Stream', streamSchema),
  Streamer: mongoose.model('Streamer', streamerSchema),
  connectDb,
  disconnectDb
}