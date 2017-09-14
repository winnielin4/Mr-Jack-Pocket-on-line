/*
 * Author: Weiran lin
 * E-mail: waynelin4wr@gmail.com
 */

//拖拉开始
function dragStart (sprite, event){
    if(allowDragStart){
        allowDragStart = false;
        allowDragStop = true;
        // 正在移动的精灵的原位置
        temPosition.x = sprite.position.x;
        temPosition.y = sprite.position.y;
    }
}

//拖拉停止
function dragStop (sprite, event){
    // console.log(oldMapSequence);
    if(allowDragStop){
        allowDragStop = false;

        if(temPosition.x === sprite.position.x && temPosition.y === sprite.position.y){
            allowDragStart = true;
            allowDragStop = false;
            map.setAll('input.draggable',true);
            sprite.angle += 90;
            Info.rotation[sprite.sequence] += 1;
            // 位置不动不做处理
        }else{
            // 精灵移动到边界外返回原位置
            var temX = (sprite.position.x-200)/170;  //移动到的位置的x表达
            var temY = (sprite.position.y-120)/170;  //y表达
            if(temX<0 || temX>2 || temY<0 || temY>2){
                var temTween = game.add.tween(sprite).to( { x: temPosition.x, y: temPosition.y }, 300, Phaser.Easing.Quartic.Out, true);
                temTween.onComplete.add(function(){
                    allowDragStart = true;
                    allowDragStop = false;
                    map.setAll('input.draggable',true)
                })
                return;
            }
            //返回原位或交换
            map.forEach(function(item){
           		if(item.nowSort % 3 == temX && Math.floor(item.nowSort/3) == temY){
           			var tween = game.add.tween(item).to( { x: 120 + (sprite.nowSort%3) * 170 + 80, y: 40 + Math.floor(sprite.nowSort/3) * 170 + 80 }, 300, Phaser.Easing.Quartic.Out, true);
           			
                    //mapSequence和oldMapSequence一样，[i]记录第i个位置应该是第几张牌，如mapSequence[0] = 2即0的位置应该是第二张牌
                    Info.mapSequence[sprite.nowSort] = Info.mapSequence.splice(item.nowSort, 1, Info.mapSequence[sprite.nowSort])[0];  //返回给服务器的每个地图的对应位置数组
                    Info.oldMapSequence[sprite.nowSort] = Info.oldMapSequence.splice(item.nowSort, 1, Info.oldMapSequence[sprite.nowSort])[0];  //返回给服务器的每个地图的对应位置数组

                    var z = sprite.nowSort;
            		sprite.nowSort = item.nowSort;
            		item.nowSort = z;
           		}
           	});
            var tween = game.add.tween(sprite).to( { x: 120 + temX * 170 + 80, y: 40 + temY * 170 + 80 }, 300, Phaser.Easing.Quartic.Out, true);
            allowDragStart = true;
            allowDragStop = false;
        }
    }
}

//更新接收的client的地图等信息
function toNewMap(Info, map){
    map.forEach(function(item){
        var tem = Info.oldMapSequence.indexOf(item.sequence);  //利用item原本的位置在数组中索引，得到现在的应在位置
        var tween = game.add.tween(item).to({ x: 120 + tem%3 * 170 + 80, y: 40 + Math.floor(tem/3) * 170 + 80}, 300, Phaser.Easing.Quartic.Out, true);
        item.nowSort = tem;
        //其他客户端等价旋转后恢复为0
        item.angle += 90 * (Info.rotation[item.sequence]%4);
        Info.rotation[item.sequence] = 0;
        //翻面
        if(Info.mapTurn[item.sequence] == 1){
            item.loadTexture('map_items_b', item.sequence);
        }
    });
    console.log(Info.detLocation[1]);

    //移动侦探
    var tween = game.add.tween(detectives.getByName('dH')).to( { x: Info.detLocation[0] , y: Info.detLocation[1] }, 300, Phaser.Easing.Quartic.Out, true);
    var tween = game.add.tween(detectives.getByName('dW')).to( { x: Info.detLocation[2] , y: Info.detLocation[3] }, 300, Phaser.Easing.Quartic.Out, true);
    var tween = game.add.tween(detectives.getByName('dE')).to( { x: Info.detLocation[4] , y: Info.detLocation[5] }, 300, Phaser.Easing.Quartic.Out, true);

    //设置功能牌
    if(Info.funCardFlag == 1){
        fun_cards.removeAll();  //只有按了“抛”后的第一次发送消息会引起其他服务器的功能牌更新s
        for (var i=0; i<4; i++){
            var str = 'fun' + i;
            if(Info.funCard[i] == 'a'){
                fun = fun_cards.create(10, 10 + 60 * i , str, 0);
                fun.side = "a";
            }else{
                fun = fun_cards.create(10, 10 + 60 * i , str, 1);
                fun.side = "b";
            }
            fun.name = i.toString();
            fun.events.onInputDown.add(fun_listener, this);
        }
        fun_cards.setAll('inputEnabled', true);
        Info.funCardFlag = 0;
    }
}

// 功能牌翻面
function fun_listener(item){
	if(item.side == "a"){
        switch(item.name){
            case '0': item.loadTexture('fun0', 1);
            break;
            case '1': item.loadTexture('fun1', 1);
            break;
            case '2': item.loadTexture('fun2', 1);
            break;
            case '3': item.loadTexture('fun3', 1);
            break;
            default:
        }
    }else{
        switch(item.name){
            case '0': item.loadTexture('fun0', 0);
            break;
            case '1': item.loadTexture('fun1', 0);
            break;
            case '2': item.loadTexture('fun2', 0);
            break;
            case '3': item.loadTexture('fun3', 0);
            break;
            default:
        }
    }
}


// 功能牌抛掷按钮响应
function onFuncUp(button, pointer) {
    Info.funCardFlag = 1;
    fun_cards.removeAll();  //把之前的组内的组件全部删去

    for (var i=0; i<4; i++){
        var str = 'fun' + i;
        var alpha = Math.random();
        if(alpha < 1 && alpha > 0.5){
            fun = fun_cards.create(10, 10 + 60 * i , str, 0);
            fun.side = "a";
        }else{
            fun = fun_cards.create(10, 10 + 60 * i , str, 1);
            fun.side = "b";
        }
        fun.name = i.toString();
        fun.events.onInputDown.add(fun_listener, this);
    }
    fun_cards.setAll('inputEnabled', true);
}

// 点击 '翻'以后，点击地图牌则翻面
function turnOver(item){
    Info.mapTurn[item.sequence] = 1;
    switch(item.name){
        case '0_a':
          item.loadTexture('map_items_b', 0);
          break;
        case "1_a":
          item.loadTexture('map_items_b', 1);
          break;
        case "2_a":
          item.loadTexture('map_items_b', 2);
          break;
        case "3_a":
          item.loadTexture('map_items_b', 3);
          break;
        case "4_a":
          item.loadTexture('map_items_b', 4);
          break;
        case "5_a":
          item.loadTexture('map_items_b', 5);
          break;
        case "6_a":
          item.loadTexture('map_items_b', 6);
          break;
        case "7_a":
          item.loadTexture('map_items_b', 7);
          break;
        case "8_a":
          item.loadTexture('map_items_b', 8);
          break;
        default:
    }
}

// 点击 '翻' 以后， 奇数次按则点地图牌翻面；偶数次则点地图旋转且可拖动
function onMapUp(){
    if(clicked){
        map.callAll('input.disableDrag', 'input');
        map.callAll('events.onInputDown.add', 'events.onInputDown', turnOver, this);
        clicked =! clicked;
    }else{
        map.callAll('input.enableDrag', 'input');
        map.callAll('events.onInputDown.remove', 'events.onInputDown', turnOver, this);
        clicked =! clicked;
    }
}



// 角色牌翻动
function onClickRole(role){
    if(role.side == 'back'){
        console.log(role.name);
        switch(role.name){
            case 0:
                role.loadTexture('roles', 0);
                role.side = 'front';
                break;
            case 1:
                role.loadTexture('roles', 1);
                role.side = 'front';
                break;
            case 2:
                role.loadTexture('roles', 2);
                role.side = 'front';
                break;
            case 3:
                role.loadTexture('roles', 3);
                role.side = 'front';
                break;
            case 4:
                role.loadTexture('roles', 4);
                role.side = 'front';
                break;
            case 5:
                role.loadTexture('roles', 5);
                role.side = 'front';
                break;
            case 6:
                role.loadTexture('roles', 6);
                role.side = 'front';
                break;
            case 7:
                role.loadTexture('roles', 7);
                role.side = 'front';
                break;
            case 8:
                role.loadTexture('roles', 8);
                role.side = 'front';
                break;
            default:
        }
    }else{
        role.loadTexture('role_back');
        role.side = 'back';
    }
}