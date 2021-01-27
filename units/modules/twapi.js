const axios = require('axios');

const streamerInfo = async function (id) {

  if(!id){
    let err = new Error(`the id is not defined`);
    err.name = 404;
    throw err; 
  }

  try{
    let streamerInfo = {};

    const [resp1, resp2, resp3, resp4] = await axios.all([
      axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${id}`),
      axios.get(`https://api.twitch.tv/helix/users?id=${id}`),
      axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${id}`),
      axios.get(`https://api.twitch.tv/helix/streams?user_id=${id}`)
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

    return {data: streamerInfo};
  }catch (err){
    err.name = 400;
    throw err;
  }
}

const search = async function (keyword) {

  if(!keyword){
    let err = new Error(`the keyword is not defined`);
    err.name = 404;
    throw err; 
  }

  try{
    return await axios.get(`https://api.twitch.tv/helix/search/channels?query=${keyword}`);
  }catch (err){
    err.name = 400;
    throw err;
  }
}

exports.search = search;
exports.streamerInfo = streamerInfo;