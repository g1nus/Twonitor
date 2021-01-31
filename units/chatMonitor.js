const {ChatClient} = require("dank-twitch-irc");

const dao = require('./modules/dao/eventList');

async function monitor ({streamerId, streamId, channelName, batchLength = 200, interval = 10*60000, linkedEventList = false}) {

  processStreamerId = streamerId;
  var msgs = [];

  dao.connect().then(async () => {
    console.log(`[CM - (${process.pid})${streamerId}] request to monitor chat ${channelName}`);

    let chatClient = new ChatClient();

    setInterval(async () => {

      const used = process.memoryUsage();
      console.log("MEMORY USAGE!");
      for (let key in used) {
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }

      const messages = await dao.extractEventListMessages(streamId);
      const words = Array.prototype.concat(...messages.map((sentence) => sentence.split(" ").filter((x) => /^[\x00-\x7F]+$/.test(x))));
      console.log("|||there are " + words.length + " words");

      
      const result = Object.entries(
      words.reduce((previous, current) => {
        if (previous[current] === undefined) previous[current] = 1;
        else previous[current]++;
        return previous;
      }, {})).sort((a, b) => b[1] - a[1]).filter((x) => (x[1] > 1)).slice(0,3);

      console.log(`Most used words in the past ${interval} milliseconds : `, result);
      await dao.pushTunitToEventList(streamId, result);
    }, interval);

    chatClient.on("ready", async function (){
      console.log("[CM] Successfully connected to chat");
      let newEventListMdbId = await dao.insertNewEventList(streamId, streamId);

      if(newEventListMdbId === -1){
        await dao.disconnect();
        console.log(`\n[CM - ${processStreamerId}] this streamer chat is already monitored, bye...\n`);
        process.exit(0);

      //otherwise connect chat to stream
      }else{
        await dao.linkEventListToStream(streamId, newEventListMdbId);
        linkedEventList = true;
      }

    });
    chatClient.on("close", (error) => {
      if (error != null) {
        console.error("Client closed due to error", error);
      }else{
        console.log("Client closed");
      }
    });

    //Normal chat messages handler
    chatClient.on("PRIVMSG", async (msg) => {
      try {
        //console.log(`[#${msg.channelName}] ${msg.displayName}: ${msg.messageText}`);
        msgs.push({user: msg.displayName, message: msg.messageText});
        if(msgs.length > batchLength && linkedEventList){
          await dao.pushMessagesToEventList(streamId, msgs);
          console.log('saved the messages');
          msgs = [];
        }else if(msgs.length > batchLength){
          console.log(`[CM] link to chat not established yet`);
        }
      } catch (err) {
        console.log(err);
      }
    });

    //notification handlers
    chatClient.on("USERNOTICE", async (msg) => {
      // sub and resub messages have the same parameters, so we can handle them both the same way
      console.log("USERNOTICE!!!");
      if (msg.isSub() || msg.isResub()) {
        try {
          const subscription = {
            user: msg.displayName,
            months: msg.eventParams.cumulativeMonths,
            msg: msg.messageText,
            subPlanName: msg.eventParams.subPlanName
          }
          console.log(subscription);
    
          await dao.pushSubscriptionToEventList(streamId, subscription);
        } catch (err) {
          console.log(err);
        }
      }else if(msg.isRaid()){
        try{
          const raid = {
            user: msg.displayName,
            viewers: msg.eventParams.viewerCount
          }
          console.log(raid);

          await dao.pushRaidToEventList(streamId, raid);
        } catch (err) {
          console.log(err);
        }
      }
    });

    chatClient.connect().catch((err) => {
      console.log('chat connection error');
      console.log(err);
    });
    chatClient.join(channelName).catch((err) => {
      console.log('chat join error');
      console.log(err);
    });
  });
}

//IPC message handlers
process.on('message', (msg) => {
  if(msg?.streamerId && msg?.streamId && msg?.channelName){
    monitor(msg);
  }else{
    console.log('[CM] invalid message!')
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log(`\n[CM - (${process.pid})${processStreamerId} | sigterm] bye...\n`);
  await dao.disconnect();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[CM - (${process.pid})${processStreamerId} | sigkill] bye...\n`);
  await dao.disconnect();
  process.exit(0);
})