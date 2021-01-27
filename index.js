require('module-alias/register');

const express = require('express');
const bodyParser = require('body-parser');
const {fork} = require('child_process');

const security = require('@utils/security');

const app = express();
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
      if(req.body.challenge){
        console.log(`It's a challenge!`);
        res.set('Content-Type', 'text/html');
        res.send(req.body.challenge);

        //spawning new child process for monitoring
        console.log(`webhook for user ${req.body.subscription.condition.broadcaster_user_id}`);

        let newChild = fork('./units/streamMonitor');
        newChild.send({
          id: req.body.subscription.condition.broadcaster_user_id,
          clientId: config.clientId,
          authorization: config.authorization.access_token
        });

      }else{
        res.sendStatus(200);
      }
    })

    router.get('/fork', async (req, res, next) => {
      try{
        if(req.query.status === 'true'){
          console.log('Requesting status');
          children.map((child) => {
            console.log({streamer: child.streamer, pid: child.process.pid});
            child.process.send(child.process.pid);
          })
        }else if(req.query.pid !== undefined){
          console.log(`time to kill ${req.query.pid}!`);
          process.kill(req.query.pid);
          let newChildren = children.filter((child) => child.process.pid !== parseInt(req.query.pid, 10));
          console.log(`THOSE are the new children`, newChildren);
          children.splice(0, children.length);
          children = [...newChildren];
        }else{
          let newChild = fork('./units/streamMonitor');
          children.push({streamer: Math.floor(Math.random() * Math.floor(100000)), process: newChild});
          newChild.send(newChild.pid);
        }
        res.sendStatus(200);

      }catch(err){
        err.name = 400;
        throw err;
      }

    })

    app.use('/', router)

    //last middleware for sending error
    app.use((err, req, res, next) => {
      //console.error('[Error]', err);
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