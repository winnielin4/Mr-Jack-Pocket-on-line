/*
 * Author: Weiran lin
 * E-mail: waynelin4wr@gmail.com
 */

document.write("<script language=javascript src='static/listener.js'></script>");


var allowDragStart = true;
var allowDragStop = false;
var allowClick = true;
var temPosition={};
var function_button;
var fun;
var clicked = true;
var randomArr = randomArr();

var Game = {};
var Info = {}
Info.mapSequence = [];
Info.oldMapSequence = [];  //oldMapSequence相当于mapSequence的副本，保留本地的地图信息
var reOldMapSequence = [];
Info.rotation = ls();  //每张牌的旋转情况
Info.detLocation = [];  //记录侦探的位置
Info.funCard = [];  //功能牌的正反情况
Info.funCardFlag = 0;  //只有按了'抛'键的下一次提交才可以使功能键更新
Info.mapTurn = ls();  //指示每张牌是否翻起来


Game.preload = function() {
    game.load.spritesheet('map_items_a', 'assets/sprites/map_a.png', 160, 160);
    game.load.spritesheet('map_items_b', 'assets/sprites/map_b.png', 160, 160);
    game.load.spritesheet('detective-H', 'assets/sprites/Holmes.png', 50, 50);
    game.load.spritesheet('detective-W', 'assets/sprites/watson.png', 50, 50);
    game.load.spritesheet('detective-E', 'assets/sprites/edler.png', 50, 50);
    game.load.spritesheet('fun0', 'assets/sprites/funA.png', 50, 50);
    game.load.spritesheet('fun1', 'assets/sprites/funB.png', 50, 50);
    game.load.spritesheet('fun2', 'assets/sprites/funC.png', 50, 50);
    game.load.spritesheet('fun3', 'assets/sprites/funD.png', 50, 50);
    game.load.spritesheet('function_button', 'assets/buttons/function_button.png', 50, 50);
    game.load.spritesheet('map_over_button', 'assets/buttons/map_over_button.png', 50, 50);
    game.load.spritesheet('role_back', 'assets/sprites/role_back.png', 50, 50);
    game.load.spritesheet('roles', 'assets/sprites/roles.png', 50, 50);
    game.load.image('einstein', 'assets/buttons/end.png', 100, 100);
}

var game;
var map;

Game.create =  function() {
  game.stage.backgroundColor = "#4488AA";
  
  //"回合结束" 按键
  var image = game.add.sprite(700, 400, 'einstein');
  image.inputEnabled = true;
  image.events.onInputDown.add(listener, this);

  map = game.add.group();  //9张地图组成的组
  detectives = game.add.group();  //三张侦探组成的组
  fun_cards = game.add.group();  //四张牌组成的功能组
  role_cards = game.add.group();  //九张牌组成的角色牌


  //画地图
  var item;
  //地图组 a面 设置位置
  for(var i = 0; i < 9; i++){
     //每个图的位置
      item = map.create(200 + 170*(Math.floor(i%3)), 120 + 170*(Math.floor(i/3)), 'map_items_a', i);

      item.nowSort = i;  //代表现在的排序位置
      item.sequence = i;  //代表最初始所在的位置

      Info.mapSequence[i] = i; Info.oldMapSequence[i] = i;  //在数组中代表该item

      item.name = i + "_a";

      //每个图的中心位置
      item.anchor.setTo(0.5, 0.5);
      // Enable input detection, then it's possible be dragged.
      item.inputEnabled = true;
      // Make this item draggable.
      item.input.enableDrag();

      // Then we make it snap to 170x170 grids. item: 160*160
      item.input.enableSnap(170, 170, false, true,200,120);
      item.input.bringToTop = true;
      // Add a handler to rotate it when clicked
      //item.events.onInputUp.add(onClick, this);

      // Add a handler to remove it using different options when dropped.
      item.events.onDragStart.add(dragStart, this);

      // Add a handler to remove it using different options when dropped.
      item.events.onDragStop.add(dragStop, this);
    }
////////////////////////////////////////////////////////////////////////////////////////

  //侦探组 设置初始位置，可拖动
  var det;
  det = detectives.create(350, 550, 'detective-H');  det.name = 'dH';  
  det = detectives.create(70, 106, 'detective-W');  det.name = 'dW'; 
  det = detectives.create(633, 106, 'detective-E'); det.name = 'dE';
  detectives.setAll('inputEnabled', true);
  detectives.callAll('input.enableDrag', 'input');


//////////////////////////////////////////////////////////////////////////////////////
  //功能牌的抛掷按钮
  function_button = game.add.button(20, 400, 'function_button', onFuncUp, this);

  //地图牌的翻面按钮
  map_over_button = game.add.button(20, 460, 'map_over_button', onMapUp, this);

  //抽取角色牌   角色牌翻动 
  for(var i in randomArr){
    // 角色牌定位
    role = role_cards.create(700 + 60*(Math.floor(i%3)), 20 + 60*(Math.floor(i/3)), 'role_back');
    // 每张牌可以接受输入
    role.inputEnabled = true;
    // 牌背面朝上
    role.side = 'back';
    // 编序号
    role.name = randomArr[i];
    // 添加按键响应
    role.events.onInputUp.add(onClickRole, this);
  }
}


//更新新地图, 由接受的client执行
Game.newMap = function(Info){
    toNewMap(Info, map);  //更新被动client的地图
    reOldMapSequence = Info.oldMapSequence;  //将传入的最新的地图赋值给被动传入的client的对应数组中
    reMapTurn = Info.mapTurn;  //将传入的最新的地图覆盖情况赋值给被动传入的client的对应数组中
    oldMapReplace(reOldMapSequence, reMapTurn);
}

//转存oldMapSequence和reMapTurn (直接存有同名的情况)
function oldMapReplace(reOldMapSequence, reMapTurn){
    Info.oldMapSequence = reOldMapSequence;
    Info.mapTurn = reMapTurn
}

//发出消息的客户端的 “发出信息”按钮响应，发出的client执行 
function listener () {
    updateDetLocation();
    updateFuncCards();
    console.log(Info.mapTurn);
    Client.endRound(Info);
    Info.rotation = [0,0,0,0,0,0,0,0,0];  //发出消息的客户端 “旋转数组”归0
    Info.funCardFlag = 0;  //发送消息时，不用翻转功能牌
}

//更新三个侦探所在的位置
function updateDetLocation(){
    Info.detLocation[0] = detectives.getByName('dH').x;
    Info.detLocation[1] = detectives.getByName('dH').y;
    Info.detLocation[2] = detectives.getByName('dW').x;
    Info.detLocation[3] = detectives.getByName('dW').y;
    Info.detLocation[4] = detectives.getByName('dE').x;
    Info.detLocation[5] = detectives.getByName('dE').y;
}

//更新功能牌数组，记录每张功能牌当前的朝上面
function updateFuncCards(){
    Info.funCard = [fun_cards.getByName('0').side, fun_cards.getByName('1').side, fun_cards.getByName('2').side, fun_cards.getByName('3').side];
}

//产生随机的抽取人物地图
function randomArr(){
    var initArr = [0,1,2,3,4,5,6,7,8];
    var temArr = [];
    while (initArr.length>0){
        temArr.push(initArr.splice(Math.floor(Math.random()*initArr.length),1)[0]);
    }
    return temArr;
}

//产生全0数组
function ls(){
    var arr = [];  for(var n = 0; n < 9; n++) arr[n] = 0;  return arr;
}