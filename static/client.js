/*
 * Author: Weiran lin
 * E-mail: waynelin4wr@gmail.com
 */

var Client = {};
Client.socket = io.connect();

//点击按钮，该轮结束，返回mapSequence 地图的排序信息给server, server发给除自己以外的client
Client.endRound = function(Info){
	Client.socket.emit('endRound', Info);
}

//收到"新地图"信息后，更新该client地图
Client.socket.on('newMap', function(Info){
	Game.newMap(Info);
})