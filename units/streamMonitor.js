require('dotenv').config();
const axios = require('axios');
const {fork} = require('child_process');

const {streamerInfo, getStreamerLive} = require('./modules/twapi');
const dao = require('./modules/dao/stream');

var chatChild = null;

async function fetchData (streamerId, processStreamId) {
  console.log(`[SM - T] retrieving data`);

  try {
   //get all of streamer info (containing the active stream info)
    let resp = await streamerInfo(streamerId);

    //check if there's a mismatch between the stream we monitor and the actual live stream (may happen when the streamer restarts the stream)
    console.log(`[SM - ${processStreamId}] retireved the following id : ${resp.data.stream.id}`);
    if(!resp.data.stream){
      console.log(`############THE STREAMER WENT OFFLINE`);
      chatChild.kill('SIGINT');
      process.exit(0);
    }
    if(processStreamId !== resp.data.stream.id) console.log('#############MISMATCH');

    //construct time unit
    const tunit = {
      streamId: (processStreamId !== resp.data.stream.id) ? processStreamId : resp.data.stream.id, //quick check for streamId mismatch
      viewers: resp.data.stream.viewers,
      title: resp.data.stream.title,
      followers: resp.data.followers
    }
    //push it to stream
    await dao.pushTunitToStream(tunit);

    //send updated viewers number to the chat monitor process
    chatChild.send({
      viewers: tunit.viewers
    }); 
  } catch (err) {
    console.log(err);
  }

}

async function monitor(streamerId, processStreamId, interval = 10*60000){
  console.log('[SM-M] start monitoring...');
  
  //I get the stream data for the first time
  let resp = await getStreamerLive(streamerId);
  let streamData = resp.data.data[0];
  //since the streamer is live I also start chat monitor
  chatChild = fork('./units/chatMonitor');
  chatChild.send({
    streamerId: streamerId,
    streamId: streamData.id,
    channelName: streamData.user_login,
    viewers: streamData.viewer_count
  });
  
  //I set the monitor to check data every X minutes
  setInterval(fetchData, interval, streamerId, processStreamId);
}

//main function
async function monitorManager({streamerId, reset = false}){

  //before anything else I connect to the database
  dao.connect().then(async function monitorStart() {
    console.log(`[SM - (${process.pid})${streamerId}] received streamer`);

    //the streamId at the start of the monitoring (can be used to check streamId mismatch)
    let processStreamId = null;
    
    //reset data if necessary
    if(reset) await dao.resetData();

    //axios token setup
    axios.defaults.headers.common['client-id'] = process.env.CLIENT_ID;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + process.env.ACCESS_TOKEN;

    try{

      //get streamer data and try to add it to the database
      let resp = await streamerInfo(streamerId);
      await dao.insertStreamer(streamerId, resp.data);
      processStreamId = resp.data.stream.id;

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
          monitor(streamerId, processStreamId);
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
  //monitorManager({streamerId: 159498717}); //jinnytty
  //monitorManager({streamerId: 57292293}); //RATIRL
  //monitorManager({streamerId: 50885108}); //vkingplyas
  //monitorManager({streamerId: 25653002}); //Iwilldominate
  //monitorManager({streamerId: 51496027}); //loltylerone
  monitorManager({streamerId: 38746172}); //esfandtv
  //monitorManager({streamerId: 24538518}); //sneakylol
  //monitorManager({streamerId: 459331509}); //auron
  //monitorManager({streamerId: 71092938}); //xqcow
  //monitorManager({streamerId: 19571641}); //ninja
  //monitorManager({streamerId: 160504245}); //39daph
  //monitorManager({streamerId: 59308271}); //TFBlade
  //monitorManager({streamerId: 94753024}); //mizkif
  //monitorManager({streamerId: 71190292}); //trainswrektv
  //monitorManager({streamerId: 124425501});  //lck
  //monitorManager({streamerId: 101572475}); //mckytv
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
  await dao.disconnect();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[SM - | sigkill]  bye...\n`);
  await dao.disconnect();
  process.exit(0);
})