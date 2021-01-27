var ipc=require('node-ipc');

ipc.config.id = 'twapp';
ipc.config.retry = 2;
ipc.config.maxRetries = 0;
ipc.config.silent = true;

var ipcMessage = function (channel, type, data) {

  ipc.connectTo(channel, function () {
    ipc.of[channel].on('connect', function () {
        ipc.of[channel].emit(type, data);
        ipc.disconnect(channel);
      }
    );
    /*
    ipc.of[channel].on('disconnect', function(){
        console.log('C| disconnected from channel');
      }
    );
    */
  })
}

exports.ipcMessage = ipcMessage;