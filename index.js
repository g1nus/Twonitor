require('module-alias/register');

const express = require('express');
const bodyParser = require('body-parser');

const security = require('@utils/security');
const {monitorNotification} = require('@controllers/callbacks');

const app = express();
//array of sub-processes
var children = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = express.Router();
//first, of all I run the startup
security.initialLogin().then(

  function (config) {

    //middleware for checking permissions of all requests
    router.use((req, res, next) => {
      console.log(req.url);
      
      if(security.passCheck(req, config.adapterSecret)){
        next();
      }else{
        res.json({error: `you're not authorized`});
      }
    });

    //Twitch notifications hook
    router.post('/t-callback', async (req, res, next) => {
      try{
        //if it's a challenge I reply with the challenge
        if(req.body.challenge){
          res.set('Content-Type', 'text/html');
          res.send(req.body.challenge);

          /*
          //TESTING CODE START===========================================
          if(req.body.subscription.type === "stream.online"){
            const child = await monitorNotification(req.body.subscription.condition.broadcaster_user_id);
            children.push(child);
          }
          //TESTING CODE END============================
          */

        //otherwise it means it's a notification
        }else{
          const payload = req.body;

          //I immediately send OK back
          res.status(200);
          res.send({});

          //check if a channel went live
          if(payload.event.type === "live"){
            //if so, then wait for the monitor to start the sub-process
            const child = await monitorNotification(payload.event.broadcaster_user_id);
            children.push(child);

          //otherwise it means the channel is going offline
          }else{
            //try to find sub-process representing the streamer 
            const p = children.find((child) => child.streamerId === payload.subscription.condition.broadcaster_user_id);
            //if I find it then I kill the process and remove it from the array of sub-processes
            if(p){
              process.kill(p.streamMonitor.pid);

              let newChildren = children.filter((child) => child.streamMonitor.pid !== p.streamMonitor.pid);
              children.splice(0, children.length);
              children = [...newChildren];
            }
          }
        }

      }catch (err){
        return next(err);
      }
    })

    //use router
    app.use('/', router)

    //last middleware for sending error
    app.use((err, req, res, next) => {
      console.error('[Error]', err);
      if(err.response?.data?.message){
        res.status(err.name).json({error: err.response.data.message});
      }else{
        res.status(err.name).json({error: err.message});
      }
    });

    app.listen(config.port, () => {
      console.log(`Example app listening at http://localhost:${config.port}`)
    })
  }
);