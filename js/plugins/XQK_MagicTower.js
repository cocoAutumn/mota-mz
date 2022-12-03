/*:
 * @target MZ
 * @plugindesc 魔塔样板核心
 * @author 小秋葵
 *
 * @help XQK_MagicTower.js
 * 本插件提供了魔塔样板工程的核心功能，
 * 使用时需要依赖官方插件PluginCommonBase.js、TextScriptBase.js、
 * UniqueDataLoader.js以及我的另一个插件XQK_CoreEngine.js。
 * 
 * 0. 取消「不以叹号开头的行走图」绘制时上移6px：
 * 这个功能对地牢画风俯视视角的魔塔来说弊大于利，因此予以取消
 * （灌木丛/流体的脚部半透明效果仍然保留）。
 * 
 * 1. 角色八项属性与职业和等级解绑：
 * RPG Maker的默认行为是，双上限、双攻双防、敏捷幸运，这八项属性的基础值
 * 只受职业和等级影响，而通过补药或事件永久增减这些值则是另一回事。
 * 对魔塔来说我们不需要前者，因此本插件屏蔽了那部分基础值。
 * 
 * 2. 魔塔的钥匙和门：
 * 在事件页中备注<door:某门>就可以调用公共事件来开门，
 * 开门的条件、成功效果（含扣除钥匙）、失败效果都定义在函数
 * Game_Party.prototype.openDoor中，可以小心修改这些内容或添加新的门。
 * 
 * 3. 魔塔的道具捡拾：
 * 在事件页中备注<item:...>就可以使用下面的脚本来捡起道具：
 * $gameParty.getItem(
 *     $dataMap.events[$gameMap._interpreter._eventId].meta.item)
 * 具体有三种写法：
 * 3.1 <item:[x,y,z]>（装进背包）：
 * 其中x为0、1、2分别表示道具类型是「物品、武器、防具」，
 * y为正整数表示该x类型下的道具编号，z为捡到的数量（默认1个，但也可以是负数）。
 * 例如<item:[0,1,2]>就表示「类型为物品，编号1，捡到2个」即2把黄钥匙。
 * 3.2 <item:能力缩写[m,n]>（加能力的宝石）：
 * 其中「能力缩写」可以为mhp,mmp,atk,def,mat,mdf,agi,luk之一，
 * 表示增加哪项能力。m表示增加多少点（可以是负数），
 * n表示加给「队伍中的」第几个角色（从0开始），逗号和n不填则全队都增加。
 * 例如<item:atk[3,0]>表示「队长攻击力增加3点」，可能是红宝石吧。
 * 3.3 <item:道具名>（血瓶等自定义效果）：
 * 这种就要在Game_Party.prototype.getItem函数中逐一判断和处理了。
 */
(() => {
    // 0. 取消上移效果，如果不想取消请将下一行注释掉即可
    Game_CharacterBase.prototype.shiftY = () => 0;

    // 1. 角色八项属性与职业和等级解绑，还有一个ParamBasePlus是下面两项相加
    Game_Actor.prototype.paramBase = function (paramId) { // 补药和事件的永久增减
        // return this.currentClass().params[paramId][this._level];
        return this._paramPlus[paramId]; // 直接对该项赋值就可以实现「过场重置某项属性」
    }
    Game_Actor.prototype.paramPlus = function (paramId) { // 装备的常数增减
        // let value = Game_Battler.prototype.paramPlus.call(this, paramId);
        let value = 0;
        for (const item of this.equips()) if (item != null) value += item.params[paramId];
        return value;
    }
    Game_Actor.prototype.clearParamPlus = function () { // 开局/过场重置全部属性
        // 可以判断 this._actorId、this._classId 等根据角色或职业来设置不同的初始属性
        this._paramPlus = [1000, 0, 10, 10, 0, 0, 0, 0];
        // 设置完最大生命和魔力之后，可能需要重新设置当前生命和魔力：
        // this._hp = 1000; this._mp = 0;
    }

    /* 2. 魔塔的钥匙和门：
    doorInfos如果未来变得很长，可以挪到外部json文件中，然后用官方插件UniqueDataLoader.js加载。
    doorInfos对象的键名"某门"必须严格和事件页备注<door:某门>对应。
    condition、success、failure都必须是可以被eval的js代码，condition中记得活用比较运算和逻辑运算。
    常用的API有（this指代$gameParty即队伍）：
    this._gold                          队伍的金钱（花钱开门很正常吧？）
    this.numItems($dataItems[n])        队伍的n号道具数量
    this.gainItem($dataItems[n], m)     队伍的n号道具增加m个（m可以是负数）
    $gameMessage.add('xxx')             显示文字（相当于h5的core.drawText）
    SoundManager.playSystemSound(n)     播放第n个系统声效（如3是蜂鸣器）
    AudioManager.playSe({name:'xxx',volume:yyy,pitch:zzz})
    播放任意声效，xxx为文件名（不含.ogg后缀），yyy为音量（0-100），zzz为音调（50-150）。
    */
    Game_Party.prototype.openDoor = function (door) {
        const doorInfos = {
            "黄门": {
                "condition": "this.numItems($dataItems[1])>=1",
                "success": "this.gainItem($dataItems[1],-1);AudioManager.playSe({name:'Open5',volume:100,pitch:100});",
                "failure": "SoundManager.playSystemSound(3);$gameMessage.add('你没有'+$dataItems[1].name+'！');"
            },
            "蓝门": {
                "condition": "this.numItems($dataItems[2])>=1",
                "success": "this.gainItem($dataItems[2],-1);AudioManager.playSe({name:'Open5',volume:100,pitch:100});",
                "failure": "SoundManager.playSystemSound(3);$gameMessage.add('你没有'+$dataItems[2].name+'！');"
            },
            "红门": {
                "condition": "this.numItems($dataItems[3])>=1",
                "success": "this.gainItem($dataItems[3],-1);AudioManager.playSe({name:'Open5',volume:100,pitch:100});",
                "failure": "SoundManager.playSystemSound(3);$gameMessage.add('你没有'+$dataItems[3].name+'！');"
            }
        }
        if (eval(doorInfos[door]?.condition)) {
            eval(doorInfos[door].success);
            return true;
        } else {
            eval(doorInfos[door]?.failure ?? "SoundManager.playSystemSound(3);$gameMessage.add('无法打开此门！');");
            return false; // 上一行中的字符串为「未找到对应的"某门"」时的失败效果
        }
    }

    // 3. 魔塔的道具捡拾
    Game_Party.prototype.getItem = function (s) {
        const customEffects = { // 自定义效果，可以使用command212或213播放动画或气泡表情
            "红血瓶": "this.members().forEach(e=>e.gainHp(200));$gameMap._interpreter.command212([-1,46]);",
            "蓝血瓶": "this.members().forEach(e=>e.gainHp(500));$gameMap._interpreter.command212([-1,41]);"
        }
        if (typeof s !== 'string') return $gameMessage.add('不存在的道具！可能是事件页未填写item备注。');
        const paramId = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'].indexOf(s.substring(0, 3));
        if (s.charAt(0) === '[' && s.charAt(s.length - 1) === ']') { // 物品、武器、防具
            s = eval(s);
            // 可以像这样为物品、武器、防具演奏不同声效：
            AudioManager.playSe({ name: 'Sound' + (s[0] + 1), volume: 100, pitch: 100 });
            this.gainItem(Window_ShopBuy.prototype.goodsToItem(s), s[2] ?? 1); // 默认获得1个
        } else if (paramId >= 0 && s.charAt(s.length - 1) === ']') { // 8种宝石
            s = eval(s.substring(3));
            const actors = s.length < 2 ? this.members() : [this.members()[s[1]]];
            for (let actor of actors) actor.addParam(paramId, s[0]);
            // 可以像这样根据paramId演奏不同声效：
            AudioManager.playSe({ name: 'Up' + (paramId + 1), volume: 100, pitch: 100 });
        } else eval(customEffects[s]); // 其他自定义效果，如血瓶
        return $gameMap._interpreter.command123(['A', 0]); // 独立开关 A = ON
    }
})()