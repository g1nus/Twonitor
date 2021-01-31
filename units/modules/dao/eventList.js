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
      console.log('[DB] successful disconnection');
      resolve();
    })
  });
};

const resetData = function () {
  return new Promise(async function (resolve, reject) {
    EventList.deleteMany({}).then(function (){
      console.log('[DB] success resetting events list!');
      resolve();
    }).catch(function (err) {
      console.log(err);
      reject();
    });
  })
};

const getEventListByStreamId = function(streamId) {
  return new Promise(async function (resolve, reject) {
    console.log(`[DB] serching for events of stream ${streamId}`);
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
      console.log(`[DB] the events of stream ${streamId} are already monitored, no insertion required`);
      resolve(-1);

    }else{
      const eventList = new EventList({
        streamId: streamId
      });
      eventList.save().then(function () {
        console.log('[DB] success adding new events list into database');
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
      console.log(`[DB] chat already linked to stream, no link required`);
      resolve();
    }else{
      liveStream.eventList = newEventListMdbId;

      liveStream.save().then(function () {
        console.log('[DB] success linking events list to streamer');
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

    const liveEventList = await EventList.findOne({streamId: streamId});
    liveEventList.messages.push(...messages);

    liveEventList.save().then(function () {
        console.log(`[DB] success pushing messages to events list of stream (${streamId})`);
        resolve();
      }).catch(function (err) {
        console.log(err);
        reject();
      });
  });
};

const pushSubscriptionToEventList = function(streamId, subscription) {
  return new Promise(async function (resolve, reject) {

    const liveEventList = await EventList.findOne({streamId: streamId});
    liveEventList.subscriptions.push(subscription);

    liveEventList.save().then(function () {
        console.log(`[DB] success pushing subscription to events list of stream (${streamId})`);
        resolve();
      }).catch(function (err) {
        console.log(err);
        reject();
      });
  });
};

const pushTunitToEventList = function(streamId, tunit) {
  return new Promise(async function (resolve, reject) {

    const liveEventList = await EventList.findOne({streamId: streamId});
    liveEventList.chatTunits.push({topWords: tunit});

    liveEventList.save().then(function () {
        console.log(`[DB] success pushing most used words to events list of stream (${streamId})`);
        resolve();
      }).catch(function (err) {
        console.log(err);
        reject();
      });
  });
};

const pushRaidToEventList = function(streamId, raid) {
  return new Promise(async function (resolve, reject) {

    const liveEventList = await EventList.findOne({streamId: streamId});
    liveEventList.raids.push(raid);

    liveEventList.save().then(function () {
        console.log(`[DB] success pushing raid to events list of stream (${streamId})`);
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
      console.log(`[DB] success extracting messages of event list (${streamId})`);
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

    liveEventList.save().then(function () {
      console.log(`[DB] success reading messages of event list (${streamId})`);
      resolve(messages.map((msgData) => msgData.message));
    }).catch(function (err) {
      console.log(err);
      reject();
    });    


  });
}

module.exports = {
  connect, disconnect, resetData, 
  getEventListByStreamId,
  insertNewEventList,
  linkEventListToStream,
  pushMessagesToEventList,
  pushSubscriptionToEventList,
  pushTunitToEventList,
  pushRaidToEventList,
  extractEventListMessages,
  readEventListMessages
};