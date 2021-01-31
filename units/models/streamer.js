const mongoose = require('mongoose');

const streamerSchema = new mongoose.Schema({
  streamerId: {type: String},
  name: {type: String},
  followers: {type: String},
  language: {type: String},
  description: {type: String},
  proPic: {type: String}, 
  streams:[
    {type: mongoose.Schema.Types.ObjectId, ref: 'Stream'}
    //{type: String}
  ]
});

module.exports = {streamerSchema};