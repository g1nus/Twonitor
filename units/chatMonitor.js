const {ChatClient} = require("dank-twitch-irc");

const {Chat, connectDb, disconnectDb} = require('./models/index');

const eraseDatabaseOnSync = true;

console.log("I'm here!");

var msgs = [];
const batchLength = 5;

function monitor(channel){
  connectDb().then(async () => {
    console.log(`got this \n`, channel);
    if (eraseDatabaseOnSync) {
      await Chat.deleteMany({}, function (err){
        if(err){
          console.log(err);
        }else{
          console.log("success resetting!");
        }
      });
    }

    await Chat.insertMany([{streamId: channel}], function (err) {
      if (err){ 
        console.log(err);
      }else{
        console.log('success creating new chat');
      }
    });


    let client = new ChatClient();

    client.on("ready", () => console.log("Successfully connected to chat"));
    client.on("close", (error) => {
      if (error != null) {
        console.error("Client closed due to error", error);
      }
    });

    client.on("PRIVMSG", async (msg) => {
      try {
        console.log(`[#${msg.channelName}] ${msg.displayName}: ${msg.messageText}`);
        if(msgs.length <= batchLength){
          msgs.push({user: msg.displayName, message: msg.messageText});
        }else{
          msgs.push({user: msg.displayName, message: msg.messageText});
          const chat = await Chat.findOne({streamId: channel});
          chat.messages.push(...msgs);
          await chat.save();
          console.log('saved the messages');
          msgs = [];
        }
      } catch (err) {
        console.log(err);
      }
    });

    client.connect();
    client.join(channel);

  });
}
monitor('lck');

/*
process.on('message', (msg) => {
  if(msg?.id && msg?.clientId && msg?.authorization){
    monitor(msg);
  }else{
    process.exit(0);
  }
});
*/
process.on('SIGTERM', () => {
  console.log(`\nbye...\n`);
  disconnectDb();
  process.exit(0);
})

process.on('SIGINT', () => {
  console.log(`\nbye...\n`);
  disconnectDb();
  process.exit(0);
})