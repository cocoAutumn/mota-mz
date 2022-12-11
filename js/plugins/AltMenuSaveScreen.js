//=============================================================================
// RPG Maker MZ - Alternative Menu and Save Screen
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 菜单、装备、存读档界面调整，含存档上限修改
 * @author 小秋葵
 *
 * @param maxSavefiles
 * @text 档案最大个数
 * @desc 填1表示只允许自动存档
 * @type number
 * @default 50
 * @min 1
 * @max 1000
 * 
 * @param maxRows
 * @text 档案页最大行数
 * @type number
 * @default 5
 * @min 1
 * @max 5
 * 
 * @param maxCols
 * @text 档案页最大列数
 * @type number
 * @default 10
 * @min 4
 * @max 10
 * 
 * @help AltMenuScreen.js
 * 本插件是两个官方插件合并以后的样子，没有插件指令。
 * 菜单界面的8个命令改为在最上方一字排开，下方则显示最多8个角色。
 * 存读档界面改为矩阵样式，并在最下面显示放大一倍的4个脸图
 * （装备界面的脸图也是），另外游戏标题被替换成了地图名称（如果存在）。
 * 可以修改全局参数来调节矩阵的宽高以及档案最大个数。
 * 另外本插件还会将菜单的最后一个命令由「游戏结束」改为「读档」，
 * 但对应的文本仍需在「数据库-用语」中自行修改。
 */
(() => {
    const param = PluginManager.parameters('AltMenuSaveScreen');
    DataManager.maxSavefiles = () => +param.maxSavefiles;
    Scene_Menu.prototype.commandGameEnd = () => SceneManager.push(Scene_Load) // 重要！重启改成读档

    Scene_MenuBase.prototype.commandWindowHeight = function () { return this.calcWindowHeight(1, true) }
    Scene_MenuBase.prototype.goldWindowHeight = function () { return this.calcWindowHeight(1, true) }
    Scene_Menu.prototype.commandWindowRect = function () {
        const ww = Graphics.boxWidth, wh = this.commandWindowHeight(), wx = 0, wy = this.mainAreaTop();
        return new Rectangle(wx, wy, ww, wh);
    }
    Scene_Menu.prototype.statusWindowRect = function () {
        const h1 = this.commandWindowHeight(), h2 = this.goldWindowHeight();
        const ww = Graphics.boxWidth, wh = this.mainAreaHeight() - h1 - h2;
        const wx = 0, wy = this.mainAreaTop() + this.commandWindowHeight();
        return new Rectangle(wx, wy, ww, wh);
    }
    Scene_ItemBase.prototype.actorWindowRect = function () {
        const rect = Scene_Menu.prototype.statusWindowRect();
        rect.y = this.mainAreaBottom() - rect.height;
        return rect;
    }
    Window_MenuCommand.prototype.maxCols = () => 8
    Window_MenuCommand.prototype.numVisibleRows = () => 1
    Window_MenuStatus.prototype.maxCols = () => 4
    Window_MenuStatus.prototype.numVisibleRows = () => 2
    Window_MenuStatus.prototype.drawItemImage = function (index) {
        const actor = this.actor(index), rect = this.itemRectWithPadding(index);
        const w = ImageManager.faceWidth, h = ImageManager.faceHeight, lineHeight = this.lineHeight();
        this.changePaintOpacity(actor.isBattleMember());
        this.contents.blt(
            ImageManager.loadFace(actor.faceName()),
            actor.faceIndex() % 4 * w, (actor.faceIndex() >>> 2) * h, w, h,
            rect.x, rect.y + lineHeight * 2, w * 1.5, h * 1.5
        ) // 不参战的候补角色默认显示半透明脸图，不需要的作者可以注释掉这两个this.changePaintOpacity
        this.changePaintOpacity(true);
    }
    Window_StatusBase.prototype.drawActorLevel = function (actor, x, y) {
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.level, x, y, ImageManager.faceWidth / 2);
        this.resetTextColor();
        this.drawText(actor.level, x + ImageManager.faceWidth, y, ImageManager.faceWidth / 2);
    }
    Sprite_Gauge.prototype.isValid = function () { return this._battler }
    Window_MenuStatus.prototype.drawItemStatus = function (index) {
        const actor = this.actor(index), rect = this.itemRectWithPadding(index), x = rect.x, y = rect.y;
        const width = rect.width, bottom = y + rect.height, lineHeight = this.lineHeight();
        this.drawActorName(actor, x, y, width);
        this.drawActorClass(actor, x + ImageManager.faceWidth, y, width);
        this.drawActorLevel(actor, x, y + lineHeight, width);
        this.placeGauge(actor, 'hp', x, bottom - lineHeight * 2);
        this.placeGauge(actor, 'mp', x + ImageManager.faceWidth, bottom - lineHeight * 2);
        if ($dataSystem.optDisplayTp)
            this.placeGauge(actor, 'tp', x + ImageManager.faceWidth * 1.5 + 4, bottom - lineHeight * 3);
        this.drawActorIcons(actor, x, bottom - lineHeight - 4, width);
    }

    // 菜单界面 END
    Window_EquipStatus.prototype.paramY = function (index) {
        return ImageManager.faceHeight * 2 + Math.floor(this.lineHeight() * (index + 1.5));
    }
    Window_EquipStatus.prototype.refresh = function () {
        this.contents.clear();
        if (this._actor) {
            const nameRect = this.itemLineRect(0), w = ImageManager.faceWidth, h = ImageManager.faceHeight;
            this.drawActorName(this._actor, nameRect.x, 0, nameRect.width);
            this.contents.blt(
                ImageManager.loadFace(this._actor.faceName()),
                this._actor.faceIndex() % 4 * w, (this._actor.faceIndex() >>> 2) * h, w, h,
                nameRect.x - 6, nameRect.height, w * 2, h * 2
            );
            this.drawAllParams();
        }
    }
    // 存读档界面 START

    const _Scene_File_create = Scene_File.prototype.create;
    Scene_File.prototype.create = function () {
        _Scene_File_create.apply(this, arguments);
        this._listWindow.height = this._listWindow.fittingHeight(+param.maxRows);
        const x = 0;
        const y = this._listWindow.y + this._listWindow.height;
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight - y;
        const rect = new Rectangle(x, y, width, height);
        const statusWindow = new Window_SavefileStatus(rect);
        this._listWindow.mzkp_statusWindow = statusWindow;
        this.addWindow(statusWindow);
    }
    const _Scene_File_start = Scene_File.prototype.start;
    Scene_File.prototype.start = function () {
        _Scene_File_start.apply(this, arguments);
        this._listWindow.ensureCursorVisible();
        this._listWindow.callUpdateHelp();
    }
    Window_SavefileList.prototype.windowWidth = () => Graphics.boxWidth
    Window_SavefileList.prototype.maxCols = () => +param.maxCols
    Window_SavefileList.prototype.itemHeight = function () { return this.lineHeight() * 2 + 16 }
    const _Window_SavefileList_callUpdateHelp =
        Window_SavefileList.prototype.callUpdateHelp;
    Window_SavefileList.prototype.callUpdateHelp = function () {
        _Window_SavefileList_callUpdateHelp.apply(this, arguments);
        if (this.active && this.mzkp_statusWindow) {
            this.mzkp_statusWindow.setSavefileId(this.savefileId());
        }
    }
    function Window_SavefileStatus() { this.initialize.apply(this, arguments) }
    Window_SavefileStatus.prototype = Object.create(Window_Base.prototype);
    Window_SavefileStatus.prototype.constructor = Window_SavefileStatus;
    Window_SavefileStatus.prototype.initialize = function (rect) {
        Window_Base.prototype.initialize.call(this, rect); this._savefileId = 1;
    }
    Window_SavefileStatus.prototype.setSavefileId = function (id) {
        this._savefileId = id; this.refresh();
    }
    Window_SavefileStatus.prototype.refresh = function () {
        const info = DataManager.savefileInfo(this._savefileId);
        const rect = this.contents.rect;
        this.contents.clear();
        this.resetTextColor();
        this.drawTitle(this._savefileId, rect.x, rect.y);
        if (info) this.drawContents(info, rect);
    }
    Window_SavefileList.prototype.drawTitle = function (Id, x, y) {
        const w = ImageManager.faceWidth;
        if (Id === 0) this.drawText(TextManager.autosave, x, y, w);
        else this.drawText(TextManager.file + (Id < 100 ? ' ' : '') + Id, x, y, w);
    }
    Window_SavefileList.prototype.drawPlaytime = function (info, x, y, width) {
        if (info.playtime) {
            let s = info.playtime;
            s = s.startsWith('00:') ? s.substring(3) : s.substring(0, 5);
            this.drawText(s, x, y, width, 'right');
        }
    }
    Window_SavefileStatus.prototype.drawTitle = function (savefileId, x, y) {
        const w = ImageManager.faceWidth;
        if (savefileId === 0) this.drawText(TextManager.autosave, x, y, w);
        else this.drawText(TextManager.file + ' ' + savefileId, x, y, w);
    }
    Window_SavefileStatus.prototype.drawContents = function (info, rect) {
        const bottom = rect.y + rect.height;
        const playtimeY = bottom - this.lineHeight();
        const w = ImageManager.faceWidth;
        this.drawText(info.title, rect.x + w, rect.y, rect.width - w);
        this.drawPartyfaces(info.faces, rect.x, bottom);
        this.drawText(info.playtime, rect.x, rect.y, rect.width, 'right');
    }
    Window_SavefileStatus.prototype.drawPartyfaces = function (faces, x, y) {
        const w = ImageManager.faceWidth, h = ImageManager.faceHeight;
        if (Array.isArray(faces)) for (let i = 0; i < faces.length; i++)
            this.contents.blt(
                ImageManager.loadFace(faces[i][0]),
                faces[i][1] % 4 * h, (faces[i][1] >>> 2) * h, w, h,
                x + i * 150 * 2, y - h * 2, w * 2, h * 2
            )
    }
    let makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function () {
        const info = makeSavefileInfo.apply(this, arguments);
        info.title = $gameMap.displayName() || $dataSystem.gameTitle;
        return info;
    };
    Game_Party.prototype.charactersForSavefile = function() {
        return this.allMembers().map(actor => [
            actor.characterName(),
            actor.characterIndex()
        ]).slice(0, 4);
    };    
    Game_Party.prototype.facesForSavefile = function() {
        return this.allMembers().map(actor => [
            actor.faceName(),
            actor.faceIndex()
        ]).slice(0, 4);
    };
})()