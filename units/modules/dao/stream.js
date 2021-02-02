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
      console.log('[DB] successful disconnection');
      resolve();
    })
  });
};

const resetData = function () {
  return new Promise(async function (resolve, reject) {
    Streamer.deleteMany({}).then(function (){
      console.log('[DB] success resetting streamer table!');
      Stream.deleteMany({}).then(function (){
        console.log('[DB] success resetting stream table!');
        EventList.deleteMany({}).then(function () {
          console.log('[DB] success resetting chat table!');
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
      console.log(`[DB] searching for streamer ${streamerId}`);
      resolve(streamer);
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const getStreamById = function(streamId) {
  return new Promise(async function (resolve, reject) {
    console.log(`[DB] serching for stream ${streamId}`);
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
      console.log(`[DB] the stream ${streamData.id} is already present, no insertion required`);
      resolve(-1);
    }else{
      const liveStream = new Stream({
        streamId: streamData.id,
        streamerId: streamerId,
        title: streamData.title,
        startedAt: streamData.startedAt
      }); 
      liveStream.tunits.push({followers: followers, viewers: streamData.viewers, title: streamData.title});

      liveStream.save().then(function () {
        console.log('[DB] success adding new stream into database');
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
      console.log(`[DB] the streamer ${streamerId} is already present, no insertion required`);
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
        console.log('[DB] success adding new streamer into database');
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
      console.log(`[DB] stream already associated with streamer, no push required`);
      resolve();
    }else{
      liveStreamer.streams.push(newStreamMdbId);

      liveStreamer.save().then(function () {
        console.log('[DB] success pushing stream to streamer');
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
    console.log({followers: newTunit.followers, viewers: newTunit.viewers, title: newTunit.title});
    liveStream.tunits.push({followers: newTunit.followers, viewers: newTunit.viewers, title: newTunit.title});

    liveStream.save().then(function () {
        console.log(`[DB] success pushing tunit to stream (${newTunit.streamId})`);
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