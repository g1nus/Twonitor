require('dotenv').config();

const crypto = require('crypto');
const axios = require('axios');

var initialLogin = async function () {
  try{
    if(process.env.ACCESS_TOKEN){

      console.log('ACCESS TOKEN is present');

      return {
        port: process.env.PORT,
        clientId: process.env.CLIENT_ID,
        secret: process.env.SECRET,
        adapterSecret: process.env.ADAPTER_SECRET,
        authorization: {
          access_token: process.env.ACCESS_TOKEN,
          token_type: 'bearer'
        }
      };
    }

    console.log('NO ACCESS TOKEN, requiring new one');

    const resp = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.SECRET}&grant_type=client_credentials`);

    console.log(resp.data);

    return {
      port: process.env.PORT,
      clientId: process.env.CLIENT_ID,
      secret: process.env.SECRET,
      adapterSecret: process.env.ADAPTER_SECRET,
      authorization: resp.data
    };

  }catch (err){
    console.error(err);

    return {
      port: process.env.PORT,
      clientId: process.env.CLIENT_ID,
      secret: process.env.SECRET,
      adapterSecret: process.env.ADAPTER_SECRET,
      authorization: 'invalid_token'
    };
  }
}

const passCheck = function (req, key) {

  //if the request is for the callback, check if it's coming from Twitch
  if(req.url === '/t-callback'){

    const HMAC_key = req.headers['twitch-eventsub-message-id'] + req.headers['twitch-eventsub-message-timestamp'] + JSON.stringify(req.body);
    var HMAC_signature = 'sha256=' + crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(HMAC_key).digest('hex');
    
    if (req.headers['twitch-eventsub-message-signature'] != HMAC_signature){
      return false;
    }else{
      return true;
    }

  }else if(req.query.key === key){
    return true;

  }else{
    return false;
  }
}


exports.initialLogin = initialLogin;
exports.passCheck = passCheck;