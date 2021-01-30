const {fork} = require('child_process');

const monitorNotification = async function (streamerId) {
  try{
    //spawning new child process for monitoring
    console.log(`forking sub-process for ${streamerId}...`)
    let newChildStream = fork('./units/streamMonitor');
    newChildStream.send({
      streamerId: streamerId
    });

    /*
    let newChildChat = fork('./units/chatMonitor');
    newChildChat.send({
      streamerId: event.broadcaster_user_id,
      streamId: event.id,
      ircChannel: event.broadcaster_user_login,
    })
    */

    return {streamerId: streamerId, streamMonitor: newChildStream};
    //return {streamerId: event.broadcaster_user_id, streamMonitor: newChildStream, chatMonitor: newChildChat};

  }catch (err){
    err.name = 400;
    console.log("ERRORRRR"); 
    console.log(err);
  }

}

module.exports = {monitorNotification};