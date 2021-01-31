require('dotenv').config();
const axios = require('axios');
const {fork} = require('child_process');

const {streamerInfo, getStreamerLive} = require('./modules/twapi');
const dao = require('./modules/dao/stream');

var chatChild = null;

async function monitorManager({streamerId, interval = 10*60000}){

  processStreamerId = streamerId;

  dao.connect().then(async () => {

    await dao.resetData();

    //monitoring function
    const monitor = async function(){
      console.log('[SM-M] start monitoring...');
      
      //I get the stream data for the first time
      let resp = await getStreamerLive(streamerId);
      let streamData = resp.data.data[0];
      //since the streamer is live I also start chat monitor
      chatChild = fork('./units/chatMonitor');
      chatChild.send({
        streamerId: streamerId,
        streamId: streamData.id,
        channelName: streamData.user_login
      });
      
      setInterval(async () => {
        console.log(`retrieving data`);
        //let resp = await getStreamerLive(streamerId);
        let resp = await streamerInfo(streamerId);
        const tunit = {
          streamId: resp.data.stream.id,
          viewers: resp.data.stream.viewers,
          title: resp.data.stream.title,
          followers: resp.data.followers
        }
        await dao.pushTunitToStream(tunit);
      }, interval);
    }

    console.log(`[SM - (${process.pid})${streamerId}] received streamer`)

    //reset data if necessary
    //await dao.resetData();

    //axios token setup
    axios.defaults.headers.common['client-id'] = process.env.CLIENT_ID;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + process.env.ACCESS_TOKEN;

    try{

      //get streamer data and try to add it to the database
      let resp = await streamerInfo(streamerId);
      await dao.insertStreamer(streamerId, resp.data);

      //check if the streamer is live
      if(resp.data.stream){
        console.log(`[SM] the streamer is live`);

        //try to add new stream, if already present, returns -1
        let newStreamMdbId = await dao.insertStream(streamerId, resp.data.stream, resp.data.followers);
        //if the stream is already present and monitored I close
        if(newStreamMdbId === -1){
          await dao.disconnect();
          console.log(`\n[${streamId}] this streamer is already monitored, bye...\n`);
          process.exit(0);

        //otherwise start monitoring
        }else{
          await dao.pushStreamToStreamer(streamerId, newStreamMdbId);
          //start actual monitoring here
          monitor();
        }

      //if the streamer is not live I can stop
      }else{
        await dao.disconnect();
        console.log(`\n[${streamerId}] this streamer is not live, bye...\n`);
        process.exit(0);
      }
    
    //catch axios and dao error
    }catch (err){
      err.name = 400;
      console.log(err);
    }

  //catch connection error to database
  }).catch((err) => {
    console.log(err);
  });
};


//monitorManager({streamerId: 536083731});
//setTimeout(() => {
  monitorManager({streamerId: 159498717}); //jinny
  //monitorManager({streamerId: 71190292}); //trainswrektv
  //monitorManager({streamerId: 6094619}); //jankos
  //monitorManager({streamerId: 453951609});
//}, 2000);


//IPC messages handlers
process.on('message', (msg) => {
  if(msg?.streamerId){
    monitorManager(msg);
  }else{
    console.log('[SM] invalid message!')
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log(`\n[SM - | sigterm]  bye...\n`);
  console.log(`trying to kill [${chatChild.pid}]`);
  try {
    process.kill(chatChild.pid);
  } catch (err) {
    console.log('error killing child sub-process!');
    if(err.code === 'ESRCH') console.log('process already dead');
  }
  await dao.disconnect();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[SM - | sigkill]  bye...\n`);
  console.log(`trying to kill [${chatChild.pid}]`);
  try {
    process.kill(chatChild.pid);
  } catch (err) {
    console.log('error killing child sub-process!');
    if(err.code === 'ESRCH') console.log('process already dead');
  }
  await dao.disconnect();
  process.exit(0);
})