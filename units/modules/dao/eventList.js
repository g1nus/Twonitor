const {EventList, Stream, connectDb, disconnectDb} = require('../../models/index');

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
    EventList.deleteMany({}).then(function (){
      console.log(`[DB${process.pid}] success resetting events list!`);
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  })
};

const getEventListByStreamId = function(streamId) {
  return new Promise(async function (resolve, reject) {
    console.log(`[DB${process.pid}] serching for events of stream ${streamId}`);
    EventList.findOne({streamId: streamId}).then(function (eventList) {
      resolve(eventList);
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const insertNewEventList = function(streamId) {
  return new Promise(async function (resolve, reject) {

    let liveEventList = await getEventListByStreamId(streamId);

    if(liveEventList){
      console.log(`[DB${process.pid}] the events of stream (${streamId}) are already monitored, no insertion required`);
      resolve(-1);

    }else{
      const eventList = new EventList({
        streamId: streamId
      });
      console.log(`[DB${process.pid}] the events of stream (${streamId}) are not monitored yet, inserting new event list`);
      eventList.save().then(function () {
        resolve(eventList._id);
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }
  });
};

const linkEventListToStream = function(streamId, newEventListMdbId) {
  return new Promise(async function (resolve, reject) {
    const liveStream = await Stream.findOne({streamId: streamId});

    if(liveStream.eventList === newEventListMdbId){
      console.log(`[DB${process.pid}] chat already linked to stream (${streamId}), no link required`);
      resolve();
    }else{
      liveStream.eventList = newEventListMdbId;

      liveStream.save().then(function () {
        resolve();
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }
  });
};

const pushMessagesToEventList = function(streamId, messages) {
  return new Promise(async function (resolve, reject) {
    await EventList.updateOne(
      {streamId: streamId}, 
      {"$push" : {messages: messages}}
    ).then(function () {
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const pushWordsToEventList = function(streamId, messages) {
  return new Promise(async function (resolve, reject) {
    const newWords = Array.prototype.concat(...messages.map((sentence) => sentence.message.split(" ").filter((x) => /^[\x00-\x7F]+$/.test(x))));

    await EventList.updateOne(
      {streamId: streamId}, 
      {"$push" : {words: newWords}}
    ).then(function () {
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const mostCommonWordsInEventList = function(streamId){
  return new Promise(async function (resolve, reject) {

    EventList.aggregate([
      { $match : { streamId : streamId } },
      {$unwind: {path: "$words"}},
      {"$group": {_id: "$words", count: { "$sum": 1}}}, 
      {"$sort": {count: -1}}, 
      {"$limit": 3}]).allowDiskUse(true)
    .then(async function (x) {
      await EventList.updateOne(
        {streamId: streamId}, 
        {words: []}
      ).then(function () {
        console.log(`[DB${process.pid}] success extracting words of ${streamId} from eventList`)
        resolve(x.filter((e) => e.count>1).map((e) => ({word: e._id, count: e.count})));
      }).catch(function (err) {
        console.log(err);
        reject();
      });
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
}

const pushSubscriptionToEventList = function(streamId, subscription) {
  return new Promise(async function (resolve, reject) {
    await EventList.updateOne(
      {streamId: streamId}, 
      {"$push" : {subscriptions: subscription}}
    ).then(function () {
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const pushTunitToEventList = function(streamId, tunit) {
  return new Promise(async function (resolve, reject) {
    await EventList.updateOne(
      {streamId: streamId}, 
      {"$push" : {chatTunits: [{topWords: tunit}]}}
    ).then(function () {
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const pushRaidToEventList = function(streamId, raid) {
  return new Promise(async function (resolve, reject) {
    await EventList.updateOne(
      {streamId: streamId}, 
      {"$push" : {raids: raid}}
    ).then(function () {
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  });
};

const extractEventListMessages = function (streamId) {
  return new Promise(async function (resolve, reject) {
    const liveEventList = await EventList.findOne({streamId: streamId});
    const messages = liveEventList.messages.splice(0, liveEventList.messages.length);

    liveEventList.save().then(function () {
      console.log(`[DB${process.pid}] success extracting messages of event list (${streamId})`);
      resolve(messages.map((msgData) => msgData.message));
    }).catch(function (err) {
      console.log(err);
      reject();
    });    


  });
}

const readEventListMessages = function (streamId) {
  return new Promise(async function (resolve, reject) {
    const liveEventList = await EventList.findOne({streamId: streamId});
    const messages = liveEventList.messages;
    resolve(messages.map((msgData) => msgData.message));
  });
}

module.exports = {
  connect, disconnect, resetData, 
  getEventListByStreamId,
  insertNewEventList,
  linkEventListToStream,
  pushMessagesToEventList,
  mostCommonWordsInEventList,
  pushWordsToEventList,
  pushSubscriptionToEventList,
  pushTunitToEventList,
  pushRaidToEventList,
  extractEventListMessages,
  readEventListMessages
};