const {Streamer, Stream, EventList, connectDb, disconnectDb} = require('../../models/index');

const connect = function (){
  return new Promise(function(resolve, reject) {
    connectDb();
    resolve();
  });
};

const disconnect = function () {
  return new Promise(function(resolve, reject) {
    disconnectDb().then(async () => {
      console.log(`[DB${process.pid}] successful disconnection`);
      resolve();
    })
  });
};

const resetData = function () {
  return new Promise(async function (resolve, reject) {
    Streamer.deleteMany({}).then(function (){
      console.log(`[DB${process.pid}] success resetting streamer table!`);
      Stream.deleteMany({}).then(function (){
        console.log(`[DB${process.pid}] success resetting stream table!`);
        EventList.deleteMany({}).then(function () {
          console.log(`[DB${process.pid}] success resetting chat table!`);
          resolve();
        }).catch(function (err) {
          console.log(err);
          reject();
        })
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  })
};

const getStreamerById = function(streamerId) {
  return new Promise(async function (resolve, reject) {
    Streamer.findOne({streamerId: streamerId}).then(function (streamer) {
      resolve(streamer);
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const getStreamById = function(streamId) {
  return new Promise(async function (resolve, reject) {
    Stream.findOne({streamId: streamId}).then(function (stream) {
      resolve(stream);
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const insertStream = function(streamerId, streamData, followers) {
  return new Promise(async function (resolve, reject) {

    let stream = await getStreamById(streamData.id);

    if(stream){
      console.log(`[DB${process.pid}] the stream ${streamData.id} is already present, no insertion required`);
      resolve(-1);
    }else{
      const liveStream = new Stream({
        streamId: streamData.id,
        streamerId: streamerId,
        title: streamData.title,
        startedAt: streamData.startedAt,
        gameName: streamData.gameName,
        gameId: streamData.gameId,
        thumbnail: `https://alpha.mangolytica.tk/static/${streamData.id}.jpg`
      }); 
      liveStream.tunits.push({followers: followers, viewers: streamData.viewers, title: streamData.title, gameName: streamData.gameName, gameId: streamData.gameId});

      liveStream.save().then(function () {
        resolve(liveStream._id);
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }
  });
};

const insertStreamer = function(streamerId, streamerData) {
  return new Promise(async function (resolve, reject) {

    let streamer = await getStreamerById(streamerId);

    if(streamer){
      console.log(`[DB${process.pid}] the streamer ${streamerId} is already present, no insertion required`);
      resolve();
    }else{
      const liveStreamer = new Streamer({
        streamerId: streamerId,
        name: streamerData.name,
        followers: streamerData.followers,
        language: streamerData.language,
        description: streamerData.description,
        proPic: streamerData.proPic
      });
  
      liveStreamer.save().then(function () {
        resolve();
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }
  });
};

const pushStreamToStreamer = function(streamerId, newStreamMdbId) {
  return new Promise(async function (resolve, reject) {
    const liveStreamer = await Streamer.findOne({streamerId: streamerId});

    if(liveStreamer.streams.includes(newStreamMdbId)){
      console.log(`[DB${process.pid}] stream already associated with streamer (${streamerId}), no push required`);
      resolve();
    }else{
      await Streamer.updateOne(
        {streamerId: streamerId}, 
        {"$push" : {streams: newStreamMdbId}}
      ).then(function () {
        resolve();
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }
  });
};

const pushTunitToStream = function(newTunit) {
  return new Promise(async function (resolve, reject) {

    const liveStream = await Stream.findOne({streamId: newTunit.streamId});
    console.log({followers: newTunit.followers, viewers: newTunit.viewers, title: newTunit.title, gameName: newTunit.gameName, gameId: newTunit.gameId});
    liveStream.tunits.push({followers: newTunit.followers, viewers: newTunit.viewers, title: newTunit.title, gameName: newTunit.gameName, gameId: newTunit.gameId});

    liveStream.save().then(function () {
        resolve(liveStream._id);
      }).catch(function (err) {
        console.log(err);
        reject();
      });
  });
}; 

module.exports = {
  connect, disconnect, resetData, 
  insertStream, insertStreamer,
  pushStreamToStreamer, pushTunitToStream,
  getStreamerById,
  getStreamById
};