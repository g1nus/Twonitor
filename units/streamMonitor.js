require('dotenv').config();
const axios = require('axios');
const {fork} = require('child_process');
const fs = require('fs');
const path = require('path');

const {streamerInfo, getStreamerLive} = require('./modules/twapi');
const dao = require('./modules/dao/stream');

var chatChild = null;
var lockFile;

async function fetchData (streamerId, processStreamId) {
  try {
   //get all of streamer info (containing the active stream info)
    let resp = await streamerInfo(streamerId);
    console.log(`[SM${process.pid}] retrieving t-unit data for streamer ${resp.data.displayName}`);

    //check if there's a mismatch between the stream we monitor and the actual live stream (may happen when the streamer restarts the stream)
    if(!resp.data.stream){
      console.log(`[SM${process.pid}] ############THE STREAMER WENT OFFLINE\n └> exiting...\n`);
      fs.unlinkSync(lockFile);
      chatChild.kill('SIGINT');
      process.exit(0);
    }
    console.log(`[SM${process.pid}] retireved the following id : ${resp.data.stream.id} (previously save id : ${processStreamId})`);
    if(processStreamId !== resp.data.stream.id) console.log(`[SM${process.pid}] #############MISMATCH`);

    //construct time unit
    const tunit = {
      streamId: (processStreamId !== resp.data.stream.id) ? processStreamId : resp.data.stream.id, //quick check for streamId mismatch
      viewers: resp.data.stream.viewers,
      title: resp.data.stream.title,
      followers: resp.data.followers,
      gameName: resp.data.stream.gameName,
      gameId: resp.data.stream.gameId
    }
    console.log(`[SM${process.pid}] pushing t-unit for streamer ${resp.data.displayName}`);
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
  //I get the stream data for the first time
  let resp = await getStreamerLive(streamerId);
  let streamData = resp.data.data[0];
  console.log(`[SM${process.pid}] forking chat monitor for ${streamData.id}...`);

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
async function monitorManager(streamerId, reset){
  
  //before anything else I connect to the database
  dao.connect().then(async function monitorStart() {
    console.log(`[SM${process.pid}] received streamer (${streamerId}) \n └> checking...`);

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
      console.log(`[SM${process.pid}] streamer name is: ${resp.data.displayName}`);
      await dao.insertStreamer(streamerId, resp.data);
      processStreamId = resp.data.stream.id;

      //check if the streamer is live
      if(resp.data.stream){
        console.log(`[SM${process.pid}] the streamer is live`);

        //try to add new stream, if already present, returns -1
        let newStreamMdbId = await dao.insertStream(streamerId, resp.data.stream, resp.data.followers);
        //if the stream is already present and monitored I close
        if(newStreamMdbId === -1){
          await dao.disconnect();
          console.log(`\n[SM${process.pid}] this stream (${processStreamId}) is already monitored... \n └> exiting...\n`);
          fs.unlinkSync(lockFile);
          process.exit(0);

        //otherwise start monitoring
        }else{
          console.log(`[SM${process.pid}] the stream (${processStreamId}) is not monitored... \n └> starting...`);
          await dao.pushStreamToStreamer(streamerId, newStreamMdbId);
          //start actual monitoring here
          monitor(streamerId, processStreamId);
        }

      //if the streamer is not live I can stop
      }else{
        await dao.disconnect();
        console.log(`\n[SM${process.pid} - ${streamerId}] this streamer is not live... \n └> exiting...\n`);
        fs.unlinkSync(lockFile);
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

//main function
function startMonitor({streamerId, reset = false}){
  //first of all I set a lock to avoid double monitor on same streamer
  const lockName = streamerId + '.lock';
  lockFile = path.join('/','tmp',lockName);
  console.log(`[SM${process.pid}] starting...\n └> creating the following lock file: ${lockFile}`);

  const lock = fs.existsSync(lockFile);
  if(lock){
    console.log(`[SM${process.pid}] streamer already locked. \n └> exiting...`);
    process.exit(0);
  }else{
    console.log(`[SM${process.pid}] locking resource...`);
	  fs.writeFileSync(lockFile, '');
    monitorManager(streamerId, reset);
  }
}

//##################################

//IPC messages handlers
process.on('message', (msg) => {
  if(msg?.streamerId){
    startMonitor(msg);
  }else{
    console.log(`[SM${process.pid}] invalid message! \n └> exiting...\n`)
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log(`\n[SM${process.pid} - sigterm] received killing signal, bye...\n`);
  console.log(`[SM${process.pid}] unlinking lock...`)
  fs.unlinkSync(lockFile)
  await dao.disconnect();
  chatChild.kill('SIGTERM');
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[SM${process.pid} - sigint] received killing signal, bye...\n`);
  console.log(`[SM${process.pid}] unlinking lock...`)
  fs.unlinkSync(lockFile)
  await dao.disconnect();
  chatChild.kill('SIGINT');
  process.exit(0);
})