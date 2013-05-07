var io = require('socket.io').listen(8866);

io.set('transports', ['xhr-polling']);
console.log('listen');

io.sockets.on('connection', function (socket) {
  console.log('connected');
  socket.on('CreditManager.OutData', function (data) {
    console.log('ondata');
    socket.broadcast.emit('CreditManager.OutData', data);
  });
  socket.on('disconnect', function () { });
});