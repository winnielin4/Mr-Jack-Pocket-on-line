/*
 * Author: Weiran lin
 * E-mail: waynelin4wr@gmail.com
 */

// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();  //create an instance
var server = http.Server(app);
var io = socketIO(server);
var port = 5000;

//加入文件路径
app.set('port', port);  
app.use('/static', express.static(__dirname + '/static'));
app.use('/assets', express.static(__dirname + '/assets'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(port, function() {
  console.log('Starting server on port:' + server.address().port);
});

var allClients = [];

//tell Socket.io to listen for any connection event, 
//which automatically gets triggered when a client connects. 
//It will create a new socket object for each client, 
//where socket.id is a unique identifier for that client.
io.on('connection', function(socket) {

    //有新玩家进入的时候调用对应函数
    console.log("New client has connected with id:",socket.id);
    
    //接受到"该轮结束"的信息，给所有client发信息
    socket.on('endRound', function(Info){
        console.log("a round is end.\t" + Info.mapSequence);
        socket.broadcast.emit('newMap', Info);
    });

    //失去连接 (刷新，退出)
    socket.on('disconnect',function(){
        console.log("client id:" + socket.id + " quit already");
        delete allClients[socket.id];
    });

});