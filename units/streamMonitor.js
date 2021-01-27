const axios = require('axios');

console.log("I'm here!");

async function monitor(data){

  console.log(`got this \n`, data);

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
}

process.on('message', (msg) => {
  if(msg?.id && msg?.clientId && msg?.authorization){
    monitor(msg);
  }else{
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log(`WHY? :(\nbye...`);
  process.exit(0);
})