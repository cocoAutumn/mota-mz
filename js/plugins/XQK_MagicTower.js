/*:
 * @target MZ
 * @plugindesc 魔塔样板核心，含有一些全局参数可供修改
 * @author 小秋葵
 *
 * @param maxTurn
 * @text 精确回合数上限
 * @desc 回合数大于此值时，怪物每回合伤害视为等差数列用公式求和，
 * 以不准确的代价防止可能的卡顿。每回合伤害相等的可以填1。
 * @type number
 * @default 1000000
 * @min 1
 * @max 9007000000000000
 *
 * @param preemptive
 * @text 默认先攻次数
 * @desc 先攻怪未指定次数时采用的默认值，负数表示前几回合不攻击
 * @type number
 * @default 1
 * @min -9007000000000000
 * @max 9007000000000000
 *
 * @param magicAttack
 * @text 默认魔攻系数
 * @desc 魔攻怪未指定系数时采用的默认值，甚至可以是负数。
 * 勇士方的防御力会乘以它，0表示无视100%防御。
 * @default 0
 *
 * @param sturdy
 * @text 默认坚固参数
 * @desc 坚固怪未指定参数时的默认值，
 * 即一位勇士每回合最多对它造成的伤害。
 * @type number
 * @default 1
 * @min 1
 * @max 9007000000000000
 *
 * @param hits
 * @text 默认连击数
 * @desc 连击怪未指定连击数时的默认值，最小为2
 * @type number
 * @default 2
 * @min 2
 * @max 9007000000000000
 *
 * @param breakArmor
 * @text 默认破甲系数
 * @desc 破甲怪未指定系数时采用的默认值，可以大于1
 * @default 0.9
 *
 * @param spike
 * @text 默认反击系数
 * @desc 反击怪未指定系数时采用的默认值，每当它被攻击时生效
 * @default 0.1
 *
 * @param purify
 * @text 默认净化倍率
 * @desc 净化怪未指定倍率时采用的默认值，1表示单纯无视魔防
 * @type number
 * @default 1
 * @min 1
 * @max 9007000000000000
 *
 * @param vampire
 * @text 默认吸血系数
 * @desc 吸血怪未指定系数时采用的默认值，必须小于1
 * @default 0.25
 *
 * @param poisonDamage
 * @text 中毒每回合伤害
 * @desc 队伍中毒时，参战人员每回合额外受到的伤害，不可被魔防抵挡
 * @type number
 * @default 5
 * @min 1
 * @max 9007000000000000
 *
 * @param cursedGold
 * @text 诅咒金币系数
 * @desc 诅咒状态下队伍战斗获得的金币会乘以它，0表示不获得金币
 * @default 0
 *
 * @param cursedExp
 * @text 诅咒经验系数
 * @desc 诅咒状态下角色战斗获得的经验会乘以它，0表示不获得经验
 * @default 0
 *
 * @param hatredAdd
 * @text 仇恨增幅
 * @desc 每打败「一只」怪物，增长多少仇恨值
 * @type number
 * @default 1
 * @min 1
 * @max 9007000000000000
 *
 * @param hatredDecay
 * @text 仇恨衰减系数
 * @desc 打败仇恨怪时，仇恨值乘以多少。清零请填0，不变请填1。
 * @default 0.5
 *
 * @param explosive
 * @text 自爆剩余生命
 * @desc 与自爆怪战斗后参战人员的最多剩余生命
 * @type number
 * @default 1
 * @min 1
 * @max 9007000000000000
 *
 * @help XQK_MagicTower.js
 * 本插件提供了魔塔样板工程的核心功能，
 * 使用时需要依赖官方插件PluginCommonBase.js、TextScriptBase.js、
 * ExtraWindow.js以及我的另一个插件XQK_CoreEngine.js。
 *
 * 1. 角色属性系统（含衰弱）：
 * RPG Maker的默认行为是，双上限、双攻双防、敏捷幸运，这八项属性的基础值
 * 只受职业和等级影响，而通过补药或事件永久增减这些值则是另一回事。
 * 对魔塔来说我们不需要前者，因此本插件屏蔽了那部分基础值。
 * 衰弱则使用RM自带的buff系统，可以设置每层的百分比、叠加方式和最大层数。
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
 * 【注意】RM「轻按」不能用于可通行事件，若道具设为可通行（在人物下方），
 * 则会先触发$gameParty.increaseSteps()再触发道具！
 *
 * 4. 魔塔的战斗系统：
 * 4.1 怪物属性：
 * 直接在「数据库-敌人」中编辑即可，但要注意下面的规则。
 * (1) 生命 = 最大魔力 * 1000000 + 最大生命，最多10位
 * (2) 攻击 = 敏捷 * 1000000 + 魔攻 * 1000 + 攻击力，最多9位
 * (3) 防御 = 幸运 * 1000000 + 魔防 * 1000 + 防御力，最多9位
 * (4) 金经 = 最多7位。需要更大范围或更高精度可以直接在备注栏写数值：
 * <hp:...> <atk:...> <def:...> <gold:...> <exp:...>
 * 特殊属性可以在右上角的特性中添加「属性有效度」，但那个百分比数值没有用。
 * 特殊属性的数值写在右下角的备注栏（比如连击数、吸反破净倍率），
 * 如果没有写的话大部分属性会有一个默认数值在本窗口右侧的插件参数里兜底。
 * 关于毒衰咒，衰弱是跟着角色走的，中毒和诅咒是跟着队伍走的，
 * 中毒的效果是参战人员按回合掉血而不是按行走步数。
 * 另外备注栏也可以用来添加生命和攻防以外的新属性（比如攻击动画）。
 * 4.2 伤害计算：
 * 本样板支持「多个勇士和多个怪物的 m VS n 战斗」，
 * 我方每回合会集火敌群中第一个存活的怪物，造成常数伤害。
 * 该怪物的生命除以此伤害（向上取整）就是打败它所用的回合数，
 * 设打败前n个怪物所用的回合数之和为turn，则第n个怪物会在从1到(turn-1)
 * 回合攻击我方（先攻属性则从0甚至负数），类似H5样板的支援属性。
 * 全部怪物的伤害相加以后，会打给我方所有参战人员，并被他们各自的魔防减免，
 * 因此实际各人员的损血会不一致，地图显伤也只显示魔防减免前的伤害。
 * 我方的参战人员上限在XQK_CoreEngine.js中修改，改成1就是常见的单一勇士。
 * 4.3 战斗触发器：
 * 在地图上放置怪物事件时，备注应填写<enemy:[x,y,...,z]>即敌人id数组。
 * 如果需要打不过就取消战斗，则事件页必须只写一行「公共事件：_sys_battle」。
 * 重生怪在id数组长度为1时才有重生效果，实现方式是RM的「暂时消除事件」指令。
 * 关于金经，金币是全队共用的，而经验是各角色自己的，经验可以触发自动进阶。
 * 但是Game_Actor.prototype.expForLevel函数（每一级所需经验）
 * 要自己复写（自带的那个四参数公式不会有人用吧？）
 * 如果需要胖老鼠/新新魔塔那样的「第二货币」型经验，可以使用变量。
 * 如需使怪物主动撞击主角时也触发战斗，请修改触发条件为「事件接触」。
 *
 * 5. 状态栏、怪物手册、地图显伤：
 * 状态栏和怪物手册需要启用官方插件ExtraWindow.js，在其中创建两个新的结构参数。
 * 状态栏的结构参数中Target Scene选择Scene_Map，填写左上角坐标和宽高，
 * 行距建议不小于30以便于\I[]图标绘制，文本内容必须为
 * \js<$gameParty.statusBar()>（这个语法依赖TextScriptBase.js）
 * 该函数每秒会被调用60次因此进行了缓存，一般会和地图上的事件页同步刷新
 * （即变量/开关/独立开关/道具数量/队伍人员变化时），如需手动刷新请使用
 * $gameMap.requestRefresh();（温馨提示：测试游戏可以按F9调节开关和变量）
 * 该插件还支持自定义该窗口的字体大小和WindowSkin图片，但比较重要的参数是
 * 最下面的Switch ID和Animation，前者表示「是否显示状态栏」的开关（默认为1），
 * 后者表示显隐是否有伸缩动画效果。
 * 怪物手册和状态栏一样，只不过显示的场景是主菜单（Scene_Menu）且条件开关为2。
 * 显示内容是\js<$gameParty.enemyBook()>，但是该内容中的\\I[_n]图标绘制
 * 要求将一张EnemyBook.png放在img/system文件夹，此图片形似H5样板的
 * terrains.png，也就是宽32的竖长条。
 * 地图显伤在两个开关同时开启时，会显示在「怪物所在格子」的左下角，
 * 第一行是回合数，第二行是伤害。负伤会显示为绿色但「不带负号！」（否则写不下6位）
 *
 * 6. 魔塔的楼层切换：
 * 在事件页中备注<stair:name[x,y,d,f]>就可以调用公共事件来切换楼层，
 * 其中name为目标地图的「编辑器中名称」，左下角的列表中可以看到。
 * 如果未填写name（即写作<stair:[x,y,d,f]>）则取当前楼层，如果name为单个汉字
 * '上'或'下'则智能选择楼上或楼下，智能选层要求地图名称为「区域名：n」，
 * n为不带前导零的层数（支持负数），这样就会自动选择同区域的n+1或n-1层，
 * 不喜欢中文冒号可以在插件中改为其他定界符。x和y为传送到的坐标，d为传送后朝向
 * （0不变，2468下左右上），f为淡出颜色（0黑屏，1白屏，其他无特效）。
 * 如果未填写[x,y,d,f]，则分两种情况：
 * (1) 如果是智能上下楼，则尝试取目标地图备注中的<上:[x,y]>或<下:[x,y]>点，
 * 注意上楼会到达楼上的'下'楼点，下楼会到达楼下的'上'楼点（类似H5样板）。
 * (2) 如果不是智能上下楼（填了完整name），或者备注中获取上下楼点失败，
 * 则保持当前坐标（注意不是H5的搜索楼梯！），楼梯不可通行时要注意有4种可能。
 * 【关于穿透性】尽量不要对任何「可通行事件」设置「仅确定键触发」，否则鼠标
 * 和触屏没法停在上面而不触发！详情请查阅样板帮助文档。
 *
 * 7. spawn机制：
 * 魔塔的特点之一是绝大部分事件需要量产，门、怪物、道具...甚至墙。
 * 如果采用复制粘贴的方式，那么后续就难以统一修改行走图、优先级、触发条件等。
 * 因此本样板提供了spawn机制，只要你在地图备注中填写<template:n>
 * （n为某个样板层的地图编号），那么这张地图就会根据每个点的「区域ID」
 * （左侧调色板的R页面，范围为0~255）自动从样板层复制相同ID的事件。
 * 常用于制作「可破的墙」等大批量事件。
 */
(() => {
    const _args = PluginManager.parameters('XQK_MagicTower');
    for (let i in _args) {
        _args[i] = +_args[i]; // 插件参数全是字符串，强转一下
        if (!Number.isFinite(_args[i]))
            console.error('插件参数' + i + '填写有误，请检查！');
    }
    _args.magicAttack ||= 0; // 用 || 是为了覆盖 NaN
    _args.breakArmor ||= 0.9;
    _args.spike ||= 0.1;
    _args.vampire ||= 0.25;
    _args.cursedGold ||= 0;
    _args.cursedExp ||= 0;
    _args.hatredDecay ||= 0.5;

    let _isArray = function (s) { // 为eval做准备
        return Array.isArray(s) || typeof s === 'string' && s[0] === '[' && s.at(-1) === ']';
    }

    // 1. 角色属性系统（含衰弱）
    Game_Actor.prototype.paramBase = function (paramId) { // 补药和事件的永久增减
        // return this.currentClass().params[paramId][this._level];
        return this._paramPlus[paramId]; // 直接对该项赋值就可以实现「过场重置某项属性」
    };
    Game_Actor.prototype.paramPlus = function (paramId) { // 装备的常数增减
        // let value = Game_Battler.prototype.paramPlus.call(this, paramId);
        let value = 0;
        for (const item of this.equips()) if (item != null) value += item.params[paramId];
        return value;
    };
    // 装备的百分比默认是乘法叠加（1.2*1.2=1.44），如需加法叠加（=1.4）请取消下面的注释
    /*
    Game_Actor.prototype.traitsPi = function () {
        return this.traitsWithId(code, id).reduce((r, t) => r + t.value - 1, 1);
    }
    */
    Game_Actor.prototype.clearParamPlus = function () { // 开局/过场重置全部属性
        this._paramPlus = [1000, 0, 10, 10, 0, 0, 0, 0];
        // 上一行是兜底值，可被「数据库-职业/角色」右下角备注中的<init:[...]>覆盖
        // 顺序是：[最大生命，最大魔力，攻击力，防御力，魔攻，魔防，敏捷，幸运]
        // 缩写为：[mhp，mmp，atk，def，mat，mdf，agi，luk]
        // 在下面以及状态栏等处出现的 paramId 对应为 0~7
        if (this._actorId > 0) {
            let a = this.actor().meta.init ?? this.currentClass().meta.init;
            if (_isArray(a)) this._paramPlus = eval(a);
        }
        // 游戏开局是满血满蓝，而中途则可能需要重新设置当前生命和魔力：
        // this._hp = 1000; this._mp = 0;
    };
    // buff系统，衰弱会用到，5和-5为最大层数，不同 paramId 可以分别设置
    Game_Actor.prototype.paramBuffRate = function (paramId) {
        const b = this._buffs[paramId], r = 0.1, add = true;
        // r为每层的比例，add表示加法（true）还是乘法（false）叠加
        return add ? b * r + 1.0 : Math.pow(1.0 + (b > 0 ? r : -r), Math.abs(b));
    };
    Game_Actor.prototype.isMaxBuffAffected = function (paramId) {
        return this._buffs[paramId] === 5;
    };
    Game_Actor.prototype.isMaxDebuffAffected = function (paramId) {
        return this._buffs[paramId] === -5;
    };

    /* 2. 魔塔的钥匙和门：
    doorInfos如果未来变得很长，可以挪到外部json文件中，然后用官方插件UniqueDataLoader.js加载。
    doorInfos对象的键名"某门"必须严格和事件页备注<door:某门>对应。
    condition、success、failure都必须是可以被eval的js代码，condition中记得活用比较运算和逻辑运算。
    常用的API有（this指代$gameParty即队伍）：
    this._gold                          队伍的金钱（花钱开门很正常吧？）
    this.numItems($dataItems[n])        队伍的n号道具数量
    this.gainItem($dataItems[n], m)     队伍的n号道具增加m个（m可以是负数）
    $gameMessage.add('xxx')             显示文字（相当于h5的core.drawText）
    $gameMessage.drawTip('xxx', t)      左上角显示提示，持续t秒（插件API）
    SoundManager.playSystemSound(n)     播放第n个系统声效（如3是蜂鸣器）
    AudioManager.playSe({name:'xxx',volume:yyy,pitch:zzz})
    播放任意声效，xxx为文件名（不含.ogg后缀），yyy为音量（0-100），zzz为音调（50-150）。
    */
    Game_Party.prototype.openDoor = function (door) {
        const doorInfos = {
            "黄门": {
                "condition": "this.numItems($dataItems[1])>=1",
                "success": "this.gainItem($dataItems[1],-1);AudioManager.playSe({name:'Open5',volume:100,pitch:100});",
                "failure": "SoundManager.playSystemSound(3);$gameMessage.drawTip('你没有'+$dataItems[1].name+'！');"
            },
            "蓝门": {
                "condition": "this.numItems($dataItems[2])>=1",
                "success": "this.gainItem($dataItems[2],-1);AudioManager.playSe({name:'Open5',volume:100,pitch:100});",
                "failure": "SoundManager.playSystemSound(3);$gameMessage.drawTip('你没有'+$dataItems[2].name+'！');"
            },
            "红门": {
                "condition": "this.numItems($dataItems[3])>=1",
                "success": "this.gainItem($dataItems[3],-1);AudioManager.playSe({name:'Open5',volume:100,pitch:100});",
                "failure": "SoundManager.playSystemSound(3);$gameMessage.drawTip('你没有'+$dataItems[3].name+'！');"
            }
        }
        // const id = $gameMap._interpreter._eventId, ev = $gameMap.event(id), x = ev._x, y = ev._y;
        // 取消上一行的注释，就可以在被eval的脚本内部使用 id ev x y 这些变量！
        if (eval(doorInfos[door]?.condition)) {
            eval(doorInfos[door].success); return true;
        } else {
            eval(doorInfos[door]?.failure ?? "SoundManager.playSystemSound(3);$gameMessage.add('无法打开此门！');");
            return false; // 上一行中的字符串为「未找到对应的"某门"」时的失败效果
        }
    }

    // 3. 魔塔的道具捡拾
    Game_Party.prototype.getItem = function (s) {
        const customEffects = { // 自定义效果，可以使用command212或213播放动画或气泡表情
            "红血瓶": "this.allMembers().forEach(e=>e.gainHp(200));$gameMap._interpreter.command212([-1,46]);",
            "蓝血瓶": "this.allMembers().forEach(e=>e.gainHp(500));$gameMap._interpreter.command212([-1,41]);",
            "钥匙盒": "this.gainItem($dataItems[1],1);this.gainItem($dataItems[2],1);this.gainItem($dataItems[3],1);AudioManager.playSe({name:'Shop2',volume:100,pitch:100});"
        }
        // const id = $gameMap._interpreter._eventId, ev = $gameMap.event(id), x = ev._x, y = ev._y;
        // 取消上一行的注释，就能在自定义效果中使用 id ev x y 这些变量！
        if (!Array.isArray(s)) s = String(s);
        const paramId = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'].indexOf(s.slice(0, 3));
        if (_isArray(s)) { // 物品、武器、防具
            s = eval(s); s[2] ??= 1;
            // 可以像这样为物品、武器、防具演奏不同声效：
            AudioManager.playSe({ name: 'Sound' + (s[0] + 1), volume: 100, pitch: 100 });
            let item = Window_ShopBuy.prototype.goodsToItem(s);
            $gameMessage.drawTip('捡到' + item.name + (s[2] > 1 ? '×' + s[2] : ''));
            this.gainItem(item, s[2]); // 默认获得1个
        } else if (paramId >= 0 && s[3] === '[' && s.at(-1) === ']') { // 8种宝石
            s = eval(s.substring(3));
            const actors = s.length < 2 ? this.allMembers() : [this.allMembers()[s[1]]];
            for (let actor of actors) actor.addParam(paramId, s[0]);
            // 可以像这样根据paramId演奏不同声效：
            AudioManager.playSe({ name: 'Up' + (paramId + 1), volume: 100, pitch: 100 });
        } else if (s in customEffects) eval(customEffects[s]); // 其他自定义效果，如血瓶
        else return $gameMessage.add('不存在的道具' + s + '！可能是插件中未自定义其效果。');
        return $gameMap._interpreter.command123(['A', 0]); // 独立开关 A = ON
    }

    // 4. 魔塔的战斗系统
    DataManager.getEnemyInfo = function (id, x, y) { // 从数据库解析敌人属性
        const e = $dataEnemies[id];
        if (e == null) return null;
        const a = e.params;
        let o = {
            'id': id, 'name': e.name, 'gold': e.gold, 'exp': e.exp,
            'hp': a[0] + a[1] * 1e6,
            'atk': a[2] + a[4] * 1e3 + a[6] * 1e6,
            'def': a[3] + a[5] * 1e3 + a[7] * 1e6
        };
        o.special = e.traits.filter(t => t.code === 11).map(t => t.dataId);
        o.specialWords = o.special.map(i => $dataSystem.elements[i]);
        // o.dropItems = e.dropItems.map(i => [i.kind, i.dataId, i.denominator]);
        return Object.assign(o, e.meta); // 可以在备注栏覆盖血攻防等属性
    }
    let _sum = function (func, from, to) { // 数列求和：回合数过多时直接用等差公式？
        if (to - from > _args.maxTurn) return (func(from) + func(to)) * (to - from + 1) / 2;
        let sum = 0; for (let i = from; i <= to; ++i) sum += func(i); return sum;
    }
    Game_Party.prototype.getDamageInfo = function (e, x, y) { // 战斗伤害计算，e为敌人id数组
        if (_isArray(e)) e = eval(e);
        e = (Array.isArray(e) ? e : [e]).filter(id => $dataEnemies[id] != null)
            .map(id => DataManager.getEnemyInfo(id, x, y))
        //  .filter(enemy => enemy.hp > 0); // 生命不大于0的怪物要忽略吗？
        let initDamage = 0, damage = 0, turn = 0, turns = new Array(e.length),
            hero_hp = this.allBattleMembers().reduce((acc, actor) => acc + actor._hp, 0),
            hero_atk = this.allBattleMembers().reduce((acc, actor) => acc + actor.atk, 0),
            hero_def = Math.min.apply(Math, this.allBattleMembers().map(actor => actor.def));
        //  hero_hp /= this.allBattleMembers().length; // 生命改为取平均值
        //  hero_atk /= this.allBattleMembers().length; // 攻击改为取平均值
        //  我方生命和攻击默认取参战人员总和（用于吸血和反击），防御力默认取最小者（破甲取最大者）。
        for (let i = 0; i < e.length; ++i) {
            let s = e[i].special; // 该怪物的全部特殊属性
            if (s.includes(7))
                initDamage += (e[i]['破甲'] ?? _args.breakArmor) * Math.max.apply(
                    Math, this.allBattleMembers().map(actor => actor.def)
                );
            if (s.includes(11)) {
                let vampire = hero_hp * (e[i]['吸血'] ?? _args.vampire);
                if (e[i]['add']) e[i].hp += vampire; // 吸走的血是否加到怪物自身
                initDamage += vampire;
            }
            if (s.includes(17)) initDamage += $gameSystem._hatred ?? 0; // 仇恨
            if (s.includes(22)) initDamage += e[i]['固伤'] ?? 0;
            /* 护盾减伤和净化在战后掉血时对不同角色分别处理 */

            if (e[i].hp <= 0) { turns[i] = 0; continue; } // 生命不大于0的怪物直接跳过

            if (s.includes(10)) // 模仿（仿攻）：默认取我方参战人员（含该怪物）攻击力最高者
                e[i].atk = Math.max.apply(
                    Math, this.allBattleMembers().map(actor => actor.atk).concat(e[i].atk)
                );
            let per_damage = this.allBattleMembers().reduce((acc, actor) => {
                // per为我方单人每回合伤害
                let per = Math.max(actor.atk - (s.includes(10) ? actor : e[i]).def, 0); // 模仿（仿防）
                if (s.includes(3)) per = Math.min(per, e[i]['坚固'] ?? _args.sturdy);
                return acc + per;
            }, 0); // 我方全队每回合伤害per_damage必须是常数，否则无法用除法计算回合数

            // if (s.includes(3)) per_damage = Math.min(per_damage, e[i]['坚固'] ?? _args.sturdy);
            // 如果希望坚固怪每回合受到的伤害与我方人数无关，请取消上一行注释

            // if (s.includes(20)) per_damage = 0; // 无敌，取消本行注释后请务必用 && 追加其他条件

            if (per_damage <= 0) { damage = Infinity; break; } // 我方被对方中任何一个防杀
            turns[i] = Math.ceil(e[i].hp / per_damage); // 打死当前怪物所用回合数，用于反击
            turn += turns[i]; // 打死之前怪物和当前怪物累计所用回合数
            if (s.includes(8)) damage += turns[i] * hero_atk * (e[i]['反击'] ?? _args.spike); // 反击
            damage += _sum(t => { // 该怪物每回合造成的伤害，t从1（先攻除外）到(turn-1)求和
                per = Math.max(e[i].atk - hero_def * (
                    s.includes(2) ? e[i]['魔攻'] ?? _args.magicAttack : 1 // 魔攻系数可以小于0
                ), 0);
                if (s.includes(6)) per *= e[i]['连击'] ?? _args.hits; // 这些_args为插件参数
                return per;
            }, s.includes(1) ? 1 - (e[i]['先攻'] ?? _args.preemptive) : 1, turn - 1);
            // 先攻次数支持任意整数，负数表示前几回合不攻击
            // if (initDamage + damage >= hero_hp) break; // 已经打不过了，要提前结束循环吗？
        }
        if ($gameSystem._poisoned) initDamage += turn * _args.poisonDamage; // 中毒按回合掉血
        return {
            'troop': e.map(enemy => enemy.id), // 敌人id数组
            'special': e.flatMap(enemy => enemy.special), // 所有特殊属性连起来（包括重复）
            'gold': e.reduce((sum, enemy) => sum + enemy.gold, 0), // 金币总和
            'exp': e.reduce((sum, enemy) => sum + enemy.exp, 0), // 经验总和
            'initDamage': Math.round(initDamage), // 包含破甲、吸血、中毒、固伤等，不可被护盾减伤
            'damage': Math.round(initDamage + damage), // 在上一行的基础上还包含先攻、反击等
            'turns': turns, 'turn': turn
        };
    }
    let _purify = function (troop, x, y) { // 敌群的净化总倍率，因为要用两次所以定义为临时函数
        return troop.reduce((acc, id) => {
            let e = DataManager.getEnemyInfo(id, x, y);
            return acc + (e.special.includes(9) ? e['净化'] ?? _args.purify : 0);
        }, 0);
    }
    let _degenerate = function (troop, x, y) { // 退化数组，虽然只需要用一次但还是定义为临时函数
        return troop.reduce((acc, id) => {
            let e = DataManager.getEnemyInfo(id, x, y), a;
            if (e.special.includes(21) && _isArray(e['退化']))
                try {
                    a = eval(e['退化']); for (let i = 0; i < a.length; ++i) acc[i] += a[i];
                } catch (ee) {
                    $gameMessage.add('退化怪的备注应写作<退化:[a,b,c,d,e,f,g,h]>，请改正！');
                }
            return acc;
        }, [0, 0, 0, 0, 0, 0, 0, 0]);
    }
    Game_Party.prototype.beforeBattle = function (enemy) { // 返回true继续战斗，返回false取消战斗
        const id = $gameMap._interpreter._eventId,
            ev = $gameMap.event(id) ?? { 'list': () => [] }, l = ev.list();
        try { ev._damageInfo = this.getDamageInfo(enemy, ev._x, ev._y); }
        catch (e) { console.error(e); return false; } // 控制台调试时万一打错了不至于游戏闪退
        if (l.length === 2 && l[0].code === 117 && l[1].code === 0) {
            // 事件页只有一行【公共事件】时，才提前判定能否战胜，否则直接开打
            // 魔防系数 = 1 - 净化总倍率，参战人员用各自的魔防减伤，全部存活才算战胜
            let d = ev._damageInfo.initDamage,
                factor = 1 - _purify(ev._damageInfo.troop, ev._x, ev._y);
            if (this.allBattleMembers().some(actor => actor._hp <= d + Math.max(
                ev._damageInfo.damage - d - actor.mdf * factor, 0
            ))) {
                ev._damageInfo.color = 'red';
                SoundManager.playSystemSound(3);
                $gameMessage.drawTip('你打不过此怪物！');
                return false;
            }
        }
        return true;
    }
    Game_Party.prototype.afterBattle = function (enemy) {
        let id = $gameMap._interpreter._eventId, ev = $gameMap.event(id) ?? {},
            o = ev._damageInfo ?? this.getDamageInfo(enemy, ev._x, ev._y),
            factor = 1, degenerate = [0, 0, 0, 0, 0, 0, 0, 0]; // 魔防系数和退化数组
        if (o.special.includes(9)) factor = 1 - _purify(o.troop, ev._x, ev._y);
        if (o.special.includes(21)) degenerate = _degenerate(o.troop, ev._x, ev._y);
        animate = this.allMembers()[0].attackAnimationId1(); // 队长的武器动画
        $gameMap._interpreter.command212([id > 0 ? id : -1, animate]);

        $gameSystem._hatred ??= 0; // 仇恨，默认按怪物数量而不是战斗场数增加
        $gameSystem._hatred += o.troop.length * _args.hatredAdd;
        if (o.special.includes(17)) $gameSystem._hatred *= _args.hatredDecay;

        if (o.special.includes(12)) $gameSystem._poisoned = true; // 中毒
        if (o.special.includes(14)) $gameSystem._cursed = true; // 诅咒
        if ($gameSystem._cursed) { o.gold *= _args.cursedGold; o.exp *= _args.cursedExp; }
        for (let a of this.allBattleMembers()) { // 参战人员依次掉血，获得经验
            a._hp -= Math.max(
                o.damage - o.initDamage - a.mdf * factor, 0
            ) + o.initDamage;
            if (a._hp <= 0) return SceneManager.goto(Scene_Gameover); // 战斗失败！
            if (o.special.includes(19)) a._hp = Math.min(a._hp, _args.explosive); // 自爆
            if (o.special.includes(13)) { // 衰弱
                a.decreaseBuff(2); a.decreaseBuff(3); // 2为攻击，3为防御，也可以衰弱其他属性
            }
            if (o.special.includes(21)) // 退化
                for (let i = 0; i < 8; ++i)
                    a._paramPlus[i] -= degenerate[i];
            a.changeExp(a.currentExp() + o.exp);
        }
        this.gainGold(o.gold); // 全队获得金币
        $gameMessage.drawTip('战斗胜利，获得' + o.gold + '\\G，' + o.exp + TextManager.expA);
        $gameTemp._undead = o.special.includes(23) && o.troop.length === 1; // 重生
        // 可以在「公共事件：_sys_battle」中进行怪物消失前的自定义处理
    }

    // 5. 状态栏、怪物手册、地图显伤，前两者需要用到官方插件ExtraWindow.js
    let _big = function (n, long) { // 大数字格式化，long为true会保留5~8位有效数字，否则2~5位
        if (!Number.isFinite(n)) return '???';
        const a = long ? [9007e12, 1e12, 1e8] : [1e13, 1e9, 1e5];
        let s = n < 0 ? '-' : '';
        n = Math.abs(n);
        if (n >= a[0]) s += Math.round(n / 1e12) + 'z';
        else if (n >= a[1]) s += Math.round(n / 1e8) + 'e';
        else if (n >= a[2]) s += Math.round(n / 1e4) + 'w';
        else s += n;
        return s;
    }
    Game_Map.prototype.requestRefresh = function () {
        this._needsRefresh = true;
        delete $gameTemp.statusCache;
        delete $gameTemp.bookCache;
    }
    let SMgoto = SceneManager.goto;
    SceneManager.goto = function (sceneClass) {
        if (sceneClass === Scene_Map) {
            delete $gameTemp.statusCache;
            delete $gameTemp.bookCache;
        }
        return SMgoto.call(SceneManager, sceneClass);
    } // 关闭菜单栏回到地图时，清空状态栏和手册缓存，因为可能进行了整队操作
    // 5.1 状态栏
    Game_Party.prototype.statusBar = function () {
        let s = $gameTemp.statusCache; // 优先读取缓存（地图名称除外）
        if (s == null) {
            s = '';
            for (let a of this.allMembers().slice(0, 2)) { // 显示前几个勇士的信息？
                s += '\u3000\u3000' + a._name + ' ' + TextManager.levelA + ' ' + a._level + '\n';
                s += TextManager.hpA + ' ' + _big(a._hp) + '/' + _big(a.mhp) + '\n';
                s += TextManager.mpA + ' ' + _big(a._mp) + '/' + _big(a.mmp) + '\n';
                for (let i = 2; i <= 5; ++i) { // 攻击 防御 魔攻 魔防 [敏捷 幸运]
                    s += TextManager.param(i) + ' ';
                    if (a.isDebuffAffected(i)) s += '\\C[_ffc0cb]'; // 衰弱
                    s += _big(a.param(i), true);
                    s += '\\C[0]\n';
                }
                s += TextManager.expA + ' ' + _big(a.currentExp()) + '\n';
            }
            s += '  \\C[_FFD700]' + this.numItems($dataItems[1]).padZero(2);
            s += '  \\C[_66CCFF]' + this.numItems($dataItems[2]).padZero(2);
            s += '  \\C[_FF0000]' + this.numItems($dataItems[3]).padZero(2);
            s += '\\C[0]\n\\G ' + this._gold;
            $gameTemp.statusCache = s;
        }
        if ($dataMap != null) s = $dataMap.displayName + '\n' + s;
        return s;
    }
    // 5.2 怪物手册
    let drawIcon = Window_Base.prototype.drawIcon;
    Window_Base.prototype.drawIcon = function (iconIndex, x, y) { // 绘制怪物图标
        if (typeof iconIndex === 'number') return drawIcon.apply(this, arguments);
        const maxCol = 1; // 每行多少个
        const bitmap = ImageManager.loadSystem("EnemyBook");
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % maxCol) * pw;
        const sy = Math.floor(iconIndex / maxCol) * ph;
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y);
    };
    Game_Party.prototype.enemyBook = function () {
        let ids = [], s = $gameTemp.bookCache;
        if (s != null) return s; else s = '';
        for (let ev of $gameMap.events()) if (ev._damageInfo != null) ids = ids.concat(ev._damageInfo.troop);
        ids = ids.filter((id, i, a) => a.indexOf(id) === i).slice(0, 9); // 最多同时显示多少种怪物
        for (let id of ids) {
            let e = DataManager.getEnemyInfo(id), d = this.getDamageInfo(id), c = '\\C[_FFD700]';
            if (d.damage <= 0) c = '\\C[_00FF00]';
            else if (d.damage >= Math.min.apply(
                Math, $gameParty.allBattleMembers().map(a => a._hp + a.mdf)
            )) c = '\\C[_FF0000]';
            s += '\n\\I[_%1]%2，%3：%4，%5：%6，%7：%8，%9：%10\n\u3000\\G：%11，%12：%13，%14：%15，%16：%17'.format(
                e.id - 1, e.name, // 图标，名称
                TextManager.hpA, _big(e.hp),
                TextManager.param(2), _big(e.atk),
                TextManager.param(3), _big(e.def), // 生命，攻击，防御
                '回合', _big(d.turn),
                _big(e.gold), TextManager.expA, _big(e.exp), // 金币，经验
                '特殊', e.specialWords.join('、') || '无',
                '伤害', c + _big(d.damage) + '\\C[0]'
            );
        }
        return $gameTemp.bookCache = s.substring(1);
    }
    // 角色窗口平时会被怪物手册遮挡，所以「技能、装备、状态、整队」需要隐藏怪物手册
    let commandPersonal = Scene_Menu.prototype.commandPersonal;
    Scene_Menu.prototype.commandPersonal = function () {
        (this._extraWindows ?? []).forEach(w => w.hide());
        return commandPersonal.apply(this, arguments);
    }
    let commandFormation = Scene_Menu.prototype.commandFormation;
    Scene_Menu.prototype.commandFormation = function () {
        (this._extraWindows ?? []).forEach(w => w.hide());
        return commandFormation.apply(this, arguments);
    }
    // 5.3 地图显伤
    let GErefresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function () {
        GErefresh.apply(this, arguments);
        if (this.isTransparent() || !this._characterName) return delete this._damageInfo;
        let ev = $dataMap.events[this._eventId], e = ev.meta.enemy;
        if ($dataEnemies[e] != null) e = [e];
        if (_isArray(e)) e = eval(e);
        if (Array.isArray(e)) {
            let o = $gameParty.getDamageInfo(e, ev._x, ev._y),
                hp = Math.min.apply(
                    Math, $gameParty.allBattleMembers().map(a => a._hp + a.mdf)
                );
            if (o.damage <= 0) o.color = '#00FF00'; // 'green'太暗了
            else if (o.damage >= hp) o.color = 'red'; // 颜色仅供参考，打不过不一定是红色
            else o.color = ['white', 'yellow', 'orange'][Math.floor(3 * o.damage / hp)];
            this._damageInfo = o;
        } else
            delete this._damageInfo;
    }
    let SCupdate = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function () {
        SCupdate.apply(this, arguments);
        let ev = this._character, w = $gameMap.tileWidth(), h = $gameMap.tileHeight(), b;
        if (this.visible && ev instanceof Game_Event && ev._damageInfo != null) {
            if (this._damage == null) {
                this._damage = new Sprite(b = new Bitmap(w, h));
                b.fontSize = Math.ceil(h / 3); // 字号
                b.fontFace = 'Consolas'; // 字体
                b.outlineColor = 'black'; // 描边颜色
                // b.outlineWidth = 3; // 描边宽度
                this._damage.position.set(-w / 2, -h * 2 / 3);
                this.addChild(this._damage);
            } else
                b = this._damage.bitmap;
            b.clear();
            // 状态栏和手册都开启时才显伤
            if (!($gameSwitches.value(1) && $gameSwitches.value(2))) return;
            b.textColor = 'white';
            b.drawText(_big(ev._damageInfo.turn), 0, 0, w, b.fontSize);
            b.textColor = ev._damageInfo.color;
            b.drawText(_big(Math.abs(ev._damageInfo.damage)), 0, b.fontSize, w, b.fontSize);
        }
    }

    // 6. 楼层切换和传送器
    const _delimiter = '：'; // 地图名称定界符，要求长度为1且不是字母、数字、减号
    if (_delimiter.length !== 1 || /^[-A-Za-z0-9]$/.test(_delimiter))
        alert('地图名称定界符' + _delimiter + '不能为字母、数字、减号，且长度必须为1！');
    Game_Player.prototype.changeFloor = function (stair, isFly) { // 返回true继续传送，否则取消传送
        let i = stair.lastIndexOf('[');
        if (i < 0 || stair.at(-1) !== ']') i = stair.length;
        let a = eval(stair.substring(i)), name = $dataMap.name,
            toName = stair.substring(0, i) || $dataMap.name; // 只写了[x,y,d,f]则同层传送
        if (toName === '上' || toName === '下') { // 如果是这两个字则智能找层，平面塔可能需要东西南北？
            if (!(name.endsWith(_delimiter + '0') ||
                new RegExp(_delimiter + '-?[1-9]+[0-9]*$').test(name)))
                return $gameMessage.add("智能上下楼要求地图的编辑器中名称以'"
                    + _delimiter + "n'结尾，n可以是负数但不能有前导零！");
            let j = name.lastIndexOf(_delimiter), n = name.substring(j + _delimiter.length);
            n -= toName === '上' ? -1 : 1; // 用减法是为了把n强转为数字
            stair = { '上': '下', '下': '上' }[toName];
            toName = name.substring(0, j) + _delimiter + n;
        } else stair = null;
        let toMap = $dataMapInfos.find(map => map?.name === toName); // 不检查唯一性，取索引最小的
        if (toMap == null) return $gameMessage.add('找不到目标楼层！请检查层数范围或事件页备注是否匹配！');
        if (!Array.isArray(a) || a.length < 2) // 未指定目标点，则尝试从备注获取，获取失败则保持当前点
            a = stair != null && /^\[-?\d+,-?\d+\]$/.test(toMap.meta[stair]) ?
                eval(toMap.meta[stair]) : [this._x, this._y];
        // 习惯RMXP魔塔样板的作者也可以试试用1号和2号事件坐标...
        $gameVariables.setValue(1, toMap.id);
        $gameVariables.setValue(2, a[0]);
        $gameVariables.setValue(3, a[1]); // 目标地图ID和坐标
        if ([2, 4, 6, 8].includes(a[2])) this._newDirection = a[2]; // 传送后朝向，0不变，2468下左右上
        if (a.length === 4) this._fadeType = a[3]; // 传送特效，0黑屏，1白屏，其他无淡出
        // 可以在这里根据name、toName、isFly播放不同声效
        return true;
    }
    // 复写事件指令，使用变量指定目标点时，朝向和淡入淡出的 0 用脚本覆盖
    Game_Interpreter.prototype.command201 = function (params) {
        if ($gameParty.inBattle() || $gameMessage.isBusy()) return false;
        let mapId, x, y, d, f;
        if (params[0] === 0) {
            mapId = params[1]; x = params[2]; y = params[3]; d = params[4]; f = params[5];
        } else {
            mapId = $gameVariables.value(params[1]);
            x = $gameVariables.value(params[2]);
            y = $gameVariables.value(params[3]);
            d = params[4] || $gamePlayer._newDirection;
            f = params[5] || $gamePlayer._fadeType;
        }
        $gamePlayer.reserveTransfer(mapId, x, y, d, f);
        this.setWaitMode("transfer");
        return true;
    }

    // 7. spawn机制：根据各点的区域编码从样板层量产事件
    let onDatabaseLoaded = Scene_Boot.prototype.onDatabaseLoaded;
    Scene_Boot.prototype.onDatabaseLoaded = function () {
        onDatabaseLoaded.apply(this, arguments);
        for (const map of $dataMapInfos) {
            if (map == null || $dataMapInfos[map.meta.template] == null) continue;
            let src = $dataMapInfos[map.meta.template].events,
                i = map.events.length, w = map.width, h = map.height;
            for (let y = 0; y < h; ++y)
                for (let x = 0; x < w; ++x) {
                    let id = map.data[(5 * h + y) * w + x]; // 六等分的最后一段
                    if (id > 0 && src[id] != null) {
                        map.events[i] = Object.assign(
                            JSON.parse(JSON.stringify(src[id])), { 'id': i, 'x': x, 'y': y }
                        );
                        ++i;
                    }
                }
        }
    }
})()