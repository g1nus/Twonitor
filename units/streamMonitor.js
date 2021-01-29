const axios = require('axios');

const {Chat, connectDb, disconnectDb} = require('./models/index');

const eraseDatabaseOnSync = true;

console.log("I'm here!");


function monitor(data){
  
  connectDb().then(async () => {
    console.log(`got this \n`, data);
    if (eraseDatabaseOnSync) {
      await Promise.all([
        //models.Stream.deleteMany({}),
        Streamer.insertMany([{name: 'carlo', age: Math.floor(Math.random() * Math.floor(100000))}, {name: 'luigi', age: Math.floor(Math.random() * Math.floor(100000))}], function (err){
          if(err){
            console.log(err);
          }else{
            console.log("success inserting!");
          }
        }),
        //models.Chat.deleteMany({})
      ]);
    }

    setTimeout(() => {
      disconnectDb();      
    }, 2000);
  });

  /*
  //axios token setup
  axios.defaults.headers.common['client-id'] = data.clientId;
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.authorization;

  try{
    let streamerInfo = {};

    const [resp1, resp2, resp3, resp4] = await axios.all([
      axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${data.id}`),
      axios.get(`https://api.twitch.tv/helix/users?id=${data.id}`),
      axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${data.id}`),
      axios.get(`https://api.twitch.tv/helix/streams?user_id=${data.id}`)
    ])

    streamerInfo.name = resp1.data.data[0].broadcaster_name;
    streamerInfo.language = resp1.data.data[0].broadcaster_language;
    streamerInfo.description = resp2.data.data[0].description;
    streamerInfo.proPic = resp2.data.data[0].profile_image_url;
    streamerInfo.views = resp2.data.data[0].view_count;
    streamerInfo.followers = resp3.data.total;
    if(resp4.data.data[0]){
      streamerInfo.stream = {};
      streamerInfo.stream.gameName = resp4.data.data[0].game_name;
      streamerInfo.stream.gameId = resp4.data.data[0].game_id;
      streamerInfo.stream.title = resp4.data.data[0].title;
      streamerInfo.stream.viewers = resp4.data.data[0].viewer_count;
      streamerInfo.stream.startedAt = resp4.data.data[0].started_at;
    }else{
      streamerInfo.stream = false;
    }

    console.log(streamerInfo);
  }catch (err){
    err.name = 400;
    console.log(err);
  }
  */
}

monitor(159498717);

/*
process.on('message', (msg) => {
  if(msg?.id && msg?.clientId && msg?.authorization){
    monitor(msg);
  }else{
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log(`WHY? :(\nbye...`);
  disconnectDb();
  process.exit(0);
})*/