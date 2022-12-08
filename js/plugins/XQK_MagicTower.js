/*:
 * @target MZ
 * @plugindesc 魔塔样板核心
 * @author 小秋葵
 *
 * @help XQK_MagicTower.js
 * 本插件提供了魔塔样板工程的核心功能，
 * 使用时需要依赖官方插件PluginCommonBase.js、TextScriptBase.js、
 * ExtraWindow.js以及我的另一个插件XQK_CoreEngine.js。
 * 
 * 0. 取消「不以叹号开头的行走图」绘制时上移6px：
 * 这个功能对地牢画风俯视视角的魔塔来说弊大于利，因此予以取消
 * （灌木丛/流体的脚部半透明效果仍然保留），且这种效果难道不应该通过
 * 主动给素材加透明像素的横行来实现么。
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
 * 
 * 4. 魔塔的战斗系统：
 * 4.1 怪物属性直接在「数据库-敌人」中编辑即可，但要注意下面的规则：
 * (1) 怪物生命 = 最大魔力 * 1000000 + 最大生命，最多10位
 * (2) 怪物攻击 = 敏捷 * 1000000 + 魔攻 * 1000 + 攻击，最多9位
 * (3) 怪物防御 = 幸运 * 1000000 + 魔防 * 1000 + 防御，最多9位
 * (4) 掉落的金币和经验最多7位。需要更大范围或更高精度可以直接在备注栏写：
 * <hp:hhh> <atk:aaa> <def:ddd> <gold:ggg> <exp:eee>
 * 特殊属性可以在右上角的特性中添加「属性有效度」，但那个百分比数值没有用。
 * 特殊属性的数值写在右下角的备注栏（比如连击数、吸反破净倍率），
 * 备注栏也可以用来添加生命和攻防以外的新属性（比如攻击动画）。
 * 4.2 伤害计算：
 * 本样板支持计算「与一队怪物同时战斗」的伤害，算法类似H5魔塔样板的「支援」。
 * 我方每回合会集火攻击敌群中第一个存活的怪物，并造成常数伤害。
 * 该怪物的生命除以该伤害（向上取整）就是它挨打的次数subturn。
 * 在地图上放置怪物事件时，备注应填写<enemy:[x,y,...,z]>即敌人id数组。
 * 
 * 5. 魔塔的状态栏和地图显伤：
 * 状态栏需要启用官方插件ExtraWindow.js，在其中创建一个新的结构参数。
 * 参数的Target Scene选择Scene_Map，填写左上角坐标和宽高，
 * 行距建议不小于32以便于\I[]图标绘制，文本内容必须为
 * \js<$gameParty.statusBar()>（这个语法依赖TextScriptBase.js）
 * 该函数每秒会被调用60次因此进行了缓存，一般会和地图上的事件页同步刷新
 * （即变量/开关/独立开关/道具数量/队伍人员变化时），如需手动刷新请使用
 * $gameMap.requestRefresh();
 * 该插件还支持自定义该窗口的字体大小和WindowSkin图片，但比较重要的参数是
 * 最下面的Switch ID和Animation，前者表示「控制状态栏显隐」的开关编号，
 * 后者表示显隐是否有伸缩动画效果。
 * 地图显伤会显示在「怪物所在格子」的左下角，第一行为回合数，第二行为伤害。
 * 伤害小于等于0时会显示为绿色但「不带负号！」（否则写不下6位）
 * 地图显伤的自动刷新时机和状态栏相同。
 */
(() => {
    // 0. 取消「非叹号开头行走图」的上移效果，如果不想取消则将下一行注释掉即可
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
        if (typeof s !== 'string') return $gameMessage.add('不存在的道具！可能是事件页未正确填写item备注。');
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

    // 4. 魔塔的战斗系统
    DataManager.getEnemyInfo = function (id, x, y) { // 从数据库解析敌人属性
        const e = $dataEnemies[id];
        if (e == null) return null;
        const a = e.params;
        let obj = {
            'id': id, 'name': e.name, 'gold': e.gold, 'exp': e.exp,
            'hp': a[0] + a[1] * 1e6,
            'atk': a[2] + a[4] * 1e3 + a[6] * 1e6,
            'def': a[3] + a[5] * 1e3 + a[7] * 1e6,
            'special': e.traits.filter(t => t.code === 11).map(t => t.dataId),
            'dropItems': e.dropItems.map(item => [item.kind, item.dataId, item.denominator])
        };
        for (let k in e.meta) obj[k] = e.meta[k];
        return obj;
    }
    let _sum = function (func, from, to) {
        if (to - from > 1e6)
            return (func(from) + func(to)) * (to - from + 1) / 2; // 回合数过多，直接高斯求和？
        let sum = 0;
        for (let i = from; i <= to; ++i) sum += func(i);
        return sum;
    }
    Game_Party.prototype.getDamageInfo = function (e, x, y) { // 战斗伤害计算，e为敌人id数组
        if (typeof e === 'string' && e.charAt(0) === '[' && e.charAt(e.length - 1) === ']')
            e = eval(e);
        e = (Array.isArray(e) ? e : [e]).filter(id => $dataEnemies[id] != null)
            .map(id => DataManager.getEnemyInfo(id, x, y))
        //  .filter(enemy => enemy.hp > 0); // 生命不大于0的怪物要忽略吗？
        let damage = 0, turn = 0, subturn;
        // 这里可以为damage增加初始值，比如吸血、先攻、破甲、净化
        for (let i = 0; i < e.length; ++i) {
            if (e[i].hp <= 0) continue;
            let per_damage = this.members().reduce((per, actor, index, members) => {
                return per + Math.max(actor.atk - e[i].def, 0);
            }, 0); // 我方造成的per_damage必须是常数，否则无法用除法计算回合数
            if (per_damage <= 0) { // 我方被对方中任何一个防杀
                damage = Infinity; break;
            }
            turn += subturn = Math.ceil(e[i].hp / per_damage);
            damage += _sum(t => {
                // 这个箭头函数是敌方每回合造成的伤害，t从1到turn-1求和
                // 可以使用 subturn 实现反击之类「和该怪物挨打次数相关」的属性
                // 不过为什么我方只有队长的防御力参与运算呢？
                return e[i].atk - this.members()[0].def;
            }, 1, turn - 1);
            // if (damage >= this.members()[0]._hp) break; // 已经打不过了，要提前结束循环吗？
        }
        return { damage: damage, turn: turn };
    }

    // 5. 状态栏和地图显伤，前者需要用到官方插件ExtraWindow.js
    let _big = function (n, long) { // 大数字格式化，long为true会保留5~8位有效数字，否则2~5位
        if (!Number.isFinite(n)) return '???';
        const a = long ? [9007e12, 1e12, 1e8] : [1e13, 1e9, 1e6];
        let s = n < 0 ? '-' : '';
        n = Math.abs(n);
        if (n >= a[0]) s += Math.round(n / 1e12) + 'z';
        else if (n >= a[1]) s += Math.round(n / 1e8) + 'e';
        else if (n >= a[2]) s += Math.round(n / 1e4) + 'w';
        else s += n;
        return s;
    }
    Game_Map.prototype.requestRefresh = function () {
        this._needsRefresh = true; delete $gameTemp.statusCache;
    }
    Game_Party.prototype.statusBar = function () {
        let s = $gameTemp.statusCache;
        if (s == null) {
            s = '';
            for (let a of this.members().slice(0, 3)) { // 显示前几个勇士的信息？
                s += '\u3000\u3000' + a._name + '\n';
                s += '生命 ' + _big(a._hp) + '/' + _big(a.mhp) + '\n';
                s += '魔力 ' + _big(a._mp) + '/' + _big(a.mmp) + '\n';
                for (let i = 2; i <= 7; ++i)
                    s += TextManager.param(i) + ' ' + _big(a.paramBasePlus(i), true) + '\n';
            }
            s += '\\C[_FFD700]' + this.numItems($dataItems[1]).padZero(2) + '  ';
            s += '\\C[_66CCFF]' + this.numItems($dataItems[2]).padZero(2) + '  ';
            s += '\\C[_FF0000]' + this.numItems($dataItems[3]).padZero(2);
            $gameTemp.statusCache = s;
        }
        if ($dataMap != null) s = $dataMap.displayName + '\n' + s;
        return s;
    }
    let GErefresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function () {
        GErefresh.apply(this, arguments);
        let ev = $dataMap.events[this._eventId], e = ev.meta.enemy;
        if ($dataEnemies[e] != null) e = [e];
        if (typeof e === 'string' && e.charAt(0) === '[' && e.charAt(e.length - 1) === ']')
            e = eval(e);
        if (Array.isArray(e) && this._characterName && !this.isTransparent()) {
            let info = $gameParty.getDamageInfo(e, ev._x, ev._y);
            if (info.damage <= 0)
                info.color = '#00FF00'; // 'green'太暗了
            else if (info.damage >= $gameParty.members()[0]._hp)
                info.color = 'red';
            else
                info.color = ['white', 'yellow', 'orange'][
                    Math.floor(3 * info.damage / $gameParty.members()[0]._hp)
                ];
            this._damageInfo = info;
        } else
            delete this._damageInfo;
    }
    let SCupdate = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function () {
        SCupdate.apply(this, arguments);
        let ev = this._character, w = $gameMap.tileWidth(), h = $gameMap.tileHeight(), b;
        if (this.visible && ev instanceof Game_Event && 'enemy' in $dataMap.events[ev._eventId].meta) {
            if (this._damage == null) {
                this._damage = new Sprite(b = new Bitmap(w, h));
                b.fontSize = 19;
                b.fontFace = 'Consolas';
                b.outlineColor = '#000000';
                this._damage.position.set(-w / 2, -h / 2);
                this.addChild(this._damage);
            } else
                b = this._damage.bitmap;
            b.clear();
            if (ev._damageInfo != null) {
                b.textColor = '#FFFFFF';
                b.drawText(_big(ev._damageInfo.turn), 0, 0, null, b.fontSize);
                b.textColor = ev._damageInfo.color;
                b.drawText(_big(Math.abs(ev._damageInfo.damage)), 0, b.fontSize, null, b.fontSize);
            }
        }
    }
})()