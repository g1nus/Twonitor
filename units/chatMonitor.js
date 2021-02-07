const {ChatClient} = require('dank-twitch-irc');

const dao = require('./modules/dao/eventList');

var msgsMax = 3001;

async function extractAndPullWords(streamId, interval) {
  return new Promise(async function(resolve, reject) {
    try {
      //memory usage (for development purposes)
      const used = process.memoryUsage();
      console.log(`[CM${process.pid}] MEMORY USAGE`);
      for (let key in used) {
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }

      //I extract the most common words from the dao
      let result = await dao.mostCommonWordsInEventList(streamId);
      console.log(`[CM${process.pid}] Most used words in the past ${interval} messages for stream (${streamId}): `, result);
      //I push the to the time unit
      await dao.pushTunitToEventList(streamId, result);
      resolve();
    } catch (err) {
      console.log(err);
      resolve(err);
    }
  });
}

/*
function monitorCycle(streamId, interval = 10*60000) {
  //I set the interval for the extraction of the most common word
  setInterval(extractAndPullWords, interval, streamId, interval);
}
*/

async function monitor ({streamerId, streamId, channelName, batchLength = 200, linkedEventList = false}) {

  //first of all I connect to the database
  dao.connect().then(async function chatMonitorStart() {
    console.log(`[CM${process.pid}] request to monitor chat '${channelName}' of streamer (${streamerId})`);

    //array which will temporarely contain messages (emptied every time they're pushed into the database)
    let msgs = [];
    let msgCount = 0;

    //chat client for reading messages
    let chatClient = new ChatClient();

    chatClient.on('ready', async function connectChat() {
      console.log(`[CM${process.pid}] Successfully connected to chat of '${channelName}'`);

      //once connected to the chat I create the eventList in the database
      let newEventListMdbId = await dao.insertNewEventList(streamId, streamId);

      //if I obtain -1 it means that there's already an eventlist for the stream
      if(newEventListMdbId === -1){
        await dao.disconnect();
        console.log(`\n[CM${streamerId}] this streamer chat is already monitored, bye...\n └> exiting...`);
        process.exit(0);

      //otherwise I can connect the eventList to the stream
      }else{
        await dao.linkEventListToStream(streamId, newEventListMdbId);
        linkedEventList = true;
      }

    });

    //chat close(and error) handler
    chatClient.on('close', function manageError(error) {
      if (error != null) {
        console.error('Client closed due to error', error);
      }else{
        console.log('Client closed');
      }
    });

    //Normal chat messages handler
    chatClient.on('PRIVMSG', async function manageMessage(msg) {
      try {
        //console.log(`[#${msg.channelName}] ${msg.displayName}: ${msg.messageText}`);
        
        //push the message into the array of messages
        msgs.push({user: msg.displayName, message: msg.messageText});
        msgCount++;
        //console.log(`msgCount: ${msgCount} / ${batchLength} - ${msgsMax}`)

        //if we surpass the batchLenght and we're linked to the eventList then we push the words into the eventList and delete the messages array
        if(msgs.length > batchLength && linkedEventList){
          let toPush = msgs;
          msgs = [];
          console.log(`[CM${process.pid}]pushing words, total messages: ${msgCount} / ${msgsMax}`)
          await dao.pushWordsToEventList(streamId, toPush);
          
        //otherwise it could be that the list is not linked yey
        }else if(msgs.length > batchLength){
          console.log(`[CM${process.pid}] link to chat not established yet`);
        }

        //if I reach the max number of messages necessary for analysis then I extract the words and analyze them
        if(msgCount > msgsMax && linkedEventList){
          msgCount = 0;
          await extractAndPullWords(streamId, msgsMax);
        }
      

      } catch (err) {
        console.log(err);
      }
    });

    //notification handlers
    chatClient.on('USERNOTICE', async (msg) => {

      //sub and resub messages have the same parameters, so we can handle them both the same way
      if (msg.isSub() || msg.isResub()) {
        try {
          //I construct the subscription object
          const subscription = {
            user: msg.displayName,
            months: msg.eventParams.cumulativeMonths,
            msg: msg.messageText,
            subPlanName: msg.eventParams.subPlanName
          }
          console.log(`[CM${process.pid}] new subscription`, subscription);
          //push it to the database
          await dao.pushSubscriptionToEventList(streamId, subscription);
        
        } catch (err) {
          console.log(err);
        }
      
      //else it may be a raid
      }else if(msg.isRaid()){
        try{
          //contruct the raid object
          const raid = {
            user: msg.displayName,
            viewers: msg.eventParams.viewerCount
          }
          console.log(`[CM${process.pid}] new raid`, raid, msg.eventParams);
          //push it to the database
          await dao.pushRaidToEventList(streamId, raid);
        
        } catch (err) {
          console.log(err);
        }
      }
    });

    //start connection with the chat
    chatClient.connect().catch((err) => {
      console.log('chat connection error');
      console.log(err);
    });
    //join channel of chat
    chatClient.join(channelName).catch((err) => {
      console.log('chat join error');
      console.log(err);
    });
  });
}

//IPC message handlers
process.on('message', (msg) => {
  if(msg?.streamerId && msg?.streamId && msg?.channelName && (msg && msg.viewers >= 0)){
    msgsMax = parseInt((msg.viewers*0.5 < 3000) ? 3001 : ((msg.viewers*0.5 > 10000) ? 9973 : msg.viewers*0.5), 10);
    monitor(msg);
  }else if(msg && msg.viewers >= 0){
      msgsMax = parseInt((msg.viewers*0.5 < 3000) ? 3001 : ((msg.viewers*0.5 > 10000) ? 9973 : msg.viewers*0.5), 10);
      console.log(`[CM${process.pid}] the new msgmax is ${msgsMax}`);
  }else{
    console.log(`[CM${process.pid}] invalid message!`)
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log(`\n[CM${process.pid} - sigterm] received killing signal, bye...\n`);
  await dao.disconnect();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[CM${process.pid} - sigint] received killing signal, bye...\n`);
  await dao.disconnect();
  process.exit(0);
})