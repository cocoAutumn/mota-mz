/*:
 * @target MZ
 * @plugindesc 一些不止可以用于魔塔的丰富扩展功能
 * @author 小秋葵
 *
 * @help XQK_CoreEngine.js
 * 本插件提供了大量对RMMZ运行时的功能扩展以及对其一些默认行为的优化，
 * 使用时需要依赖官方插件PluginCommonBase.js和TextScriptBase.js。
 * 
 * 0. 金钱、道具、战斗人员上限修改：略，详见js代码中的注释。
 * 
 * 1. 64*64素材支持：
 * 在「数据库-系统2」中将图块大小设为32*32后，运行时加载tileset将实际读取
 * 'img/tile64/'目录下的文件，游戏效果每格为64*64。
 * 推荐在'img/tilesets/'目录放置「RPG Maker VX和VX Ace」的tileset文件
 * （Steam可以免费下载RMVA的Lite版本），然后用imagemagick等工具
 * 将它们放大一倍后放进'img/tile64/'目录。
 * 远景图（parallaxes）如果一定要在编辑器中预览则也需要类似的处理。
 * 行走图（characters）在编辑器中看上去会比图块大一倍，属于正常现象。
 * 
 * 2. 转义序列增强：
 * 现在你可以在转义序列的方括号中使用负整数、字母、下划线了，如果以下划线开头，
 * 则下划线之后的部分会被解释为字符串，比如\C[_RRGGBB]可以设置任意文字颜色，
 * \I[_xxx]可以根据xxx来绘制不属于IconSet.png的图标（需要自己写逻辑）。
 * 
 * 3. 备注元数据增强：
 * 现在如果一项备注<key:value>的value是数字格式（整数或浮点数，允许指数记法），
 * 则所得到的meta对象中，该value（不能有空格）会直接解释为数字而不是字符串。
 * 
 * 4. 增强「名字输入处理」指令：
 * 你也许会注意到System.json中有一项locale，但是编辑器中无法修改。
 * 事实上修改它可以影响「名字输入处理」指令用到的几页字符。
 * 比如修改为'ru'会使用一页俄文西里尔字母，'ja'为两页假名和一页全角英数。
 * 本插件将两页假名中的最后十几个进行了优化（提供了中文数字等）并将那页
 * 全角英数改成了半角ASCII字符。
 * 
 * 5. 增强「数字输入处理」指令：
 * 现在你可以使用$gameMap._interpreter.command103([id,digits,min,max]);
 * 来扩大输入范围了，此处digits（位数）可以大于8，而min和max表示每个字符的
 * 最小值和最大值（不填则默认'0'到'9'，一般可以填'A'到'Z'或'a'到'z'）。例如
 * $gameMap._interpreter.command103([1,10,'a','z']);
 * 要求玩家输入一个长度为10的小写单词，保存在1号变量中。
 * 
 * 6. 提供「左上角临时提示」功能：
 * 还记得每次切换地图时左上角一闪而过的地图名称吗？现在你可以用那个横幅显示
 * 任意文字了，只要使用$gameMessage.drawTip('一句话',秒数);
 * 且这句话和「显示文字」等指令一样支持\V[n]等转义序列！
 */
(() => {
    // 0. 金钱、道具、战斗人员上限修改：取消注释以后自己看着改吧，不同道具上限可以不同
    // Game_Party.prototype.maxGold = () => 99999999;
    // Game_Party.prototype.maxItems = (item) => 99;
    Game_Party.prototype.maxBattleMembers = () => 8;

    // 1. 64*64素材支持
    Game_Map.prototype.tileWidth = () => 'tileSize' in $dataSystem ? $dataSystem.tileSize * 2 : 48;
    ImageManager.loadTileset = function (filename) { return this.loadBitmap('img/tile64/', filename) }

    // 2. 转义序列增强，支持\C[_RRGGBB]变色和额外的IconSet图标
    Window_Base.prototype.obtainEscapeParam = function (textState) {
        const regExp = /^\[-?\w+\]/; // 转义序列的方括号内支持负整数、字母、下划线
        const arr = regExp.exec(textState.text.slice(textState.index));
        if (arr) {
            textState.index += arr[0].length;
            if (arr[0].startsWith('[_')) return arr[0].substring(2, arr[0].length - 1); // 下划线开头
            return parseInt(arr[0].slice(1));
        } else
            return "";
    };
    Window_Base.prototype.processColorChange = function (colorIndex) { // \C[n]变色增强，支持RGB值
        if (typeof colorIndex === 'string') this.changeTextColor('#' + colorIndex);
        else this.changeTextColor(ColorManager.textColor(colorIndex));
    };

    // 3. 备注元数据增强，现在冒号右侧可以识别整数或浮点数了，支持指数记法，但不能有空格
    DataManager.extractMetadata = function (data) {
        const regExp = /<([^<>:]+)(:?)([^>]*)>/g;
        data.meta = {};
        for (; ;) {
            const match = regExp.exec(data.note);
            if (match)
                if (match[2] === ":")
                    // if (/^-?\d+$/.test(match[3])) // 这个只匹配整数
                    if (match[3].indexOf(' ') < 0 && Number.isFinite(+match[3]))
                        data.meta[match[1]] = +match[3];
                    else
                        data.meta[match[1]] = match[3];
                else
                    data.meta[match[1]] = true;
            else
                break;
        }
    };

    // 4. 增强「名字输入处理」指令，日语locale的第三页改为半角ASCII
    Window_NameInput.JAPAN1 = [
        "あ", "い", "う", "え", "お", "が", "ぎ", "ぐ", "げ", "ご",
        "か", "き", "く", "け", "こ", "ざ", "じ", "ず", "ぜ", "ぞ",
        "さ", "し", "す", "せ", "そ", "だ", "ぢ", "づ", "で", "ど",
        "た", "ち", "つ", "て", "と", "ば", "び", "ぶ", "べ", "ぼ",
        "な", "に", "ぬ", "ね", "の", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ",
        "は", "ひ", "ふ", "へ", "ほ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
        "ま", "み", "む", "め", "も", "っ", "ゃ", "ゅ", "ょ", "ゎ",
        "や", "ゆ", "よ", "わ", "ん", "零", "一", "二", "三", "四",
        "ら", "り", "る", "れ", "ろ", "を", "・", "　", "カナ", "決定"
    ];
    Window_NameInput.JAPAN2 = [
        "ア", "イ", "ウ", "エ", "オ", "ガ", "ギ", "グ", "ゲ", "ゴ",
        "カ", "キ", "ク", "ケ", "コ", "ザ", "ジ", "ズ", "ゼ", "ゾ",
        "サ", "シ", "ス", "セ", "ソ", "ダ", "ヂ", "ヅ", "デ", "ド",
        "タ", "チ", "ツ", "テ", "ト", "バ", "ビ", "ブ", "ベ", "ボ",
        "ナ", "ニ", "ヌ", "ネ", "ノ", "パ", "ピ", "プ", "ペ", "ポ",
        "ハ", "ヒ", "フ", "ヘ", "ホ", "ァ", "ィ", "ゥ", "ェ", "ォ",
        "マ", "ミ", "ム", "メ", "モ", "ッ", "ャ", "ュ", "ョ", "ヮ",
        "ヤ", "ユ", "ヨ", "ワ", "ン", "五", "六", "七", "八", "九",
        "ラ", "リ", "ル", "レ", "ロ", "ヲ", "ー", "　", "英数", "決定"
    ];
    Window_NameInput.JAPAN3 = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        '~', '!', '@', '#', '$', '%', '^', '&', '(', ')',
        ':', ';', '<', '=', '>', '?', '[', ']', '{', '}',
        '+', '-', '*', '/', 'A', 'B', 'C', 'D', 'E', 'F',
        'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 'x', 'y', 'z', '|', ' ', 'かな', '決定'
    ];

    // 5. 增强「数字输入处理」指令，支持任意可见ASCII字符
    Game_Interpreter.prototype.setupNumInput = function (params) {
        $gameMessage.setNumberInput(...params); // 接收多余参数
    };
    Game_Message.prototype.setNumberInput = function (variableId, maxDigits, min = '0', max = '9') {
        this._numInputVariableId = variableId;
        this._numInputMaxDigits = maxDigits;
        this._minCodePoint = Math.max(min.codePointAt(0), 32);
        this._maxCodePoint = Math.min(max.codePointAt(0), 126); // 最小是空格，最大是波浪线
    };
    Window_NumberInput.prototype.start = function () {
        this._min = Math.min($gameMessage._minCodePoint, $gameMessage._maxCodePoint);
        this._max = Math.max($gameMessage._minCodePoint, $gameMessage._maxCodePoint);
        this._maxDigits = $gameMessage.numInputMaxDigits();
        this._number = $gameVariables.value($gameMessage.numInputVariableId()).toString()
            .substring(0, this._maxDigits).padStart(this._maxDigits).split('').map(
                c => c.codePointAt(0).clamp(this._min, this._max)
            );
        this.updatePlacement(); this.placeButtons(); this.createContents();
        this.refresh(); this.open(); this.activate(); this.select(0);
    };
    Window_NumberInput.prototype.changeDigit = function (up) {
        const i = this.index(); this._number[i] += up ? 1 : -1;
        if (this._number[i] > this._max) this._number[i] = this._min;
        else if (this._number[i] < this._min) this._number[i] = this._max;
        this.refresh(); this.playCursorSound();
    };
    Window_NumberInput.prototype.drawItem = function (index) {
        const rect = this.itemLineRect(index); const align = "center"; this.resetTextColor();
        this.drawText(String.fromCodePoint(this._number[index]), rect.x, rect.y, rect.width, align);
    };
    let processOk = Window_NumberInput.prototype.processOk;
    Window_NumberInput.prototype.processOk = function () {
        this._number = String.fromCodePoint(...this._number);
        if (this._min === 48 && this._max === 57)
            this._number = (+this._number).clamp(0, Number.MAX_SAFE_INTEGER);
        processOk.apply(this, arguments);
    };

    // 5. 左上角临时提示，可以指定几秒后开始淡出，文字内容支持转义序列
    Game_Message.prototype.drawTip = function (text, time = 2) {
        if (typeof text === 'string' && SceneManager._scene instanceof Scene_Map) {
            const w = SceneManager._scene._mapNameWindow;
            w._showCount = time * 60;
            w.refresh(w.convertEscapeCharacters(text));
        }
    };
    Window_MapName.prototype.refresh = function (text) {
        this.contents.clear();
        if ((text ??= $gameMap.displayName()).trim().length > 0) {
            const width = Math.max(this.textWidth(text), this.innerWidth / 3);
            this.drawBackground(0, 0, width, this.lineHeight());
            this.drawText(text, 0, 0, width, "center");
        }
    };
    Scene_Map.prototype.mapNameWindowRect = function () {
        const wx = 0;
        const wy = 0;
        const ww = Graphics.boxWidth * 3 / 4; // 宽度为UI区域3/4，最少绘制其1/3底色
        const wh = this.calcWindowHeight(1, false);
        return new Rectangle(wx, wy, ww, wh);
    };
})()