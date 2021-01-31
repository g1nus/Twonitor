const {ChatClient} = require("dank-twitch-irc");

const dao = require('./modules/dao/eventList');
const batchLength = 200;
var linkedEventList = false;
const interval = 10*60000; //the first number are the minutes

async function monitor ({streamerId, streamId, channelName}) {

  var msgs = [];

  dao.connect().then(async () => {

      function topKFrequent(words, k) {
        let hash = {};

        for (let word of words) {
          console.log('checking -> (' + word + ') - ', typeof word, "l:", word.length," ".charCodeAt(0), "/", word.charCodeAt(0), "|", word.charCodeAt(0) === 56128);

          if(word === " " || word === "" || !word || word.length<=1){
            console.log("SUSPECT###############")
          }
          if (!hash[word]){
            hash[word] = 0
          }
          hash[word]++
        }

        const hashToArray = Object.entries(hash);
        const sortedArray = hashToArray.sort((a,b) => b[1] - a[1]);

        const used = process.memoryUsage();
        console.log("MEMORY USAGE!");
        for (let key in used) {
          console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }

        return sortedArray.slice(0, k);

      }

      const messages = await dao.readEventListMessages(streamId);
      const tmpwords = messages.map((sentence) => sentence.split(" "));

      //const words = Array.prototype.concat(...messages.map((sentence) => sentence.split(" ").filter((x) => !x.find((c) => c.charCodeAt(0) > 255))));

      
      
      let hash = {};

      for (let sentence of messages) {
        console.log("SENTENCE _> '", sentence, "'");
        let splitSentence = sentence.split(" ");
        console.log("SPLITTED SENTENCE _> ", splitSentence);
        let cleanSplitSentence = splitSentence.filter((x) => /^[\x00-\x7F]+$/.test(x));
        console.log("CLEAN SENTENCE _> ", cleanSplitSentence);
        for (let word of cleanSplitSentence) {
          console.log('checking -> (' + word + ') - ', typeof word, "l:", word.length," ".charCodeAt(0), "/", word.charCodeAt(0), "|", word.charCodeAt(0) === 56128);

          if(word === " " || word === "" || !word || word.length<=1){
            console.log("SUSPECT###############")
          }
          if (!hash[word]){
            hash[word] = 0
          }
          hash[word]++
        }
      }
      

      //console.log("|||there are " + words.length + " words");

      
      //const result = topKFrequent(words, 3);

      //console.log(`Most used words in the past ${interval} milliseconds : `, result);
      //await dao.pushTunitToEventList(streamId, result);
    });

}

monitor({streamerId: "159498717", streamId: "40383540077", channelName: "jinnytty"})

/*
//IPC message handlers
process.on('message', (msg) => {
  if(msg?.streamerId && msg?.streamId && msg?.channelName){
    monitor(msg);
  }else{
    console.log('[CM] invalid message!')
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log(`\n[CM - (${process.pid})${processStreamerId} | sigterm] bye...\n`);
  await dao.disconnect();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log(`\n[CM - (${process.pid})${processStreamerId} | sigkill] bye...\n`);
  await dao.disconnect();
  process.exit(0);
})
*/