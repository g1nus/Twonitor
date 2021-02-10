const mongoose = require('mongoose');

const streamerSchema = new mongoose.Schema({
  streamerId: {type: String},
  displayName: {type: String},
  loginName: {type: String},
  followers: {type: Number},
  broadcasterLanguage: {type: String},
  description: {type: String},
  profilePicture: {type: String}, 
  streams:[
    {type: mongoose.Schema.Types.ObjectId, ref: 'Stream'}
  ]
});

module.exports = {streamerSchema};