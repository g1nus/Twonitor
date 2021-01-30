const axios = require('axios');
require('dotenv').config();

const {streamerInfo} = require('./modules/twapi');
const dao = require('./modules/dao');

var processStreamerId = null;

async function monitor({streamerId}){

  processStreamerId = streamerId;

  dao.connect().then(async () => {

    console.log(`[SM] received streamer ${streamerId}`)

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

        //check if live is already monitored
        let liveMonitor = await dao.getStreamById(resp.data.stream.id);
        //if so stop the process
        if(liveMonitor){
          await dao.disconnect();
          console.log(`\n[${processStreamerId}] this streamer is already monitored, bye...\n`);
          process.exit(0);

        //otherwise start monitoring
        }else{
          let newStreamMdbId = await dao.insertStream(streamerId, resp.data.stream);
          await dao.pushStreamToStreamer(streamerId, newStreamMdbId);
          //start actual monitoring here
        }

      //if the streamer is not live I can stop
      }else{
        await dao.disconnect();
        console.log(`\n[${processStreamerId}] this streamer is not live, bye...\n`);
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

/*
monitor({streamerId: 536083731});
setTimeout(() => {
  monitor({streamerId: 453951609});
}, 2000);
*/

//IPC messages handlers
process.on('message', (msg) => {
  if(msg?.streamerId){
    monitor(msg);
  }else{
    console.log('invalid message!')
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log(`\n[${processStreamerId}] bye...\n`);
  await dao.disconnect();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[${processStreamerId}] bye...\n`);
  await dao.disconnect();
  process.exit(0);
})