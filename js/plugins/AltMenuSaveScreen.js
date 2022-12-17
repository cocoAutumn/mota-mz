//=============================================================================
// RPG Maker MZ - Alternative Menu and Save Screen
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 菜单栏和SL界面调整，支持更改最大存档个数
 * @author Yoji Ojima
 *
 * @param maxSavefiles
 * @text 档案最大个数
 * @desc 填1表示只允许自动存档
 * @type number
 * @default 80
 * @min 1
 * @max 1000
 * 
 * @param maxRows
 * @text 档案页最大行数
 * @type number
 * @default 4
 * @min 1
 * @max 4
 * 
 * @param maxCols
 * @text 档案页最大列数
 * @desc 设为1或2时，存读档界面会显示我方参战人员的行走图
 * @type number
 * @default 8
 * @min 1
 * @max 8
 *
 * @help AltSaveScreen.js
 * This plugin changes the layout of the menu and save/load screen.
 * It puts the commands on the top and the status on the bottom.
 * It puts the file list on the top and the details on the bottom.
 * It does not provide plugin commands.
 */
(() => {
    const param = PluginManager.parameters('AltMenuSaveScreen');
    DataManager.maxSavefiles = () => +param.maxSavefiles;
    Scene_Menu.prototype.commandGameEnd = () => SceneManager.push(Scene_Load); // 重要！重启改成读档
    Scene_Menu.prototype.createGoldWindow = function () { }; // 菜单栏不显示金币

    // 角色窗口平时不显示，为怪物手册预留空间，需要显示时则同时隐藏怪物手册
    let createStatusWindow = Scene_Menu.prototype.createStatusWindow;
    Scene_Menu.prototype.createStatusWindow = function () {
        createStatusWindow.apply(this, arguments);
        this._statusWindow.hide();
    }
    let commandPersonal = Scene_Menu.prototype.commandPersonal;
    Scene_Menu.prototype.commandPersonal = function () {
        (this._extraWindows ?? []).forEach(w => w.hide());
        this._statusWindow.show();
        return commandPersonal.apply(this, arguments);
    }
    let commandFormation = Scene_Menu.prototype.commandFormation;
    Scene_Menu.prototype.commandFormation = function () {
        (this._extraWindows ?? []).forEach(w => w.hide());
        this._statusWindow.show();
        return commandFormation.apply(this, arguments);
    }

    Scene_MenuBase.prototype.commandWindowHeight = function () {
        return this.calcWindowHeight(1, true);
    }
    Scene_Menu.prototype.commandWindowRect = function () {
        const ww = Graphics.boxWidth, wh = this.commandWindowHeight(),
            wx = 0, wy = this.mainAreaTop();
        return new Rectangle(wx, wy, ww, wh);
    }
    Scene_Menu.prototype.statusWindowRect = function () {
        const h = this.commandWindowHeight(),
            ww = Graphics.boxWidth, wh = this.mainAreaHeight() - h,
            wx = 0, wy = this.mainAreaTop() + h;
        return new Rectangle(wx, wy, ww, wh);
    }
    Scene_ItemBase.prototype.actorWindowRect = function () {
        const rect = Scene_Menu.prototype.statusWindowRect();
        rect.y = this.mainAreaBottom() - rect.height;
        return rect;
    }
    Window_MenuCommand.prototype.maxCols = () => 8;
    Window_MenuCommand.prototype.numVisibleRows = () => 1;
    Window_MenuStatus.prototype.maxCols = () => 4;
    Window_MenuStatus.prototype.numVisibleRows = () => 2;
    Window_MenuStatus.prototype.drawItemImage = function (index) {
        const actor = this.actor(index), rect = this.itemRectWithPadding(index),
            w = Math.min(rect.width, 144), h = Math.min(rect.height, 144),
            lineHeight = this.lineHeight();
        this.changePaintOpacity(actor.isBattleMember());
        // this.drawActorFace(actor, rect.x, rect.y + lineHeight * 2, w, h);
        this.changePaintOpacity(true);
    }
    Window_MenuStatus.prototype.drawItemStatus = function (index) {
        const actor = this.actor(index), rect = this.itemRectWithPadding(index),
            x = rect.x, y = rect.y, width = rect.width, bottom = y + rect.height,
            lineHeight = this.lineHeight();
        this.drawActorName(actor, x, y + lineHeight * 0, width);
        this.drawActorLevel(actor, x, y + lineHeight * 1, width);
        this.drawActorClass(actor, x, bottom - lineHeight * 4, width);
        this.placeBasicGauges(actor, x, bottom - lineHeight * 3, width);
        this.drawActorIcons(actor, x, bottom - lineHeight * 1, width);
    }

    const _Scene_File_create = Scene_File.prototype.create;
    Scene_File.prototype.create = function () {
        _Scene_File_create.apply(this, arguments);
        this._listWindow.height = this._listWindow.fittingHeight(+param.maxRows);
        const x = 0,
            y = this._listWindow.y + this._listWindow.height,
            width = Graphics.boxWidth,
            height = Graphics.boxHeight - y,
            rect = new Rectangle(x, y, width, height),
            statusWindow = new Window_SavefileStatus(rect);
        this._listWindow.mzkp_statusWindow = statusWindow;
        this.addWindow(statusWindow);
    }
    const _Scene_File_start = Scene_File.prototype.start;
    Scene_File.prototype.start = function () {
        _Scene_File_start.apply(this, arguments);
        this._listWindow.ensureCursorVisible();
        this._listWindow.callUpdateHelp();
    }
    Window_SavefileList.prototype.windowWidth = () => Graphics.boxWidth;
    Window_SavefileList.prototype.maxCols = () => +param.maxCols;
    Window_SavefileList.prototype.itemHeight = function () {
        return this.lineHeight() * 2 + 16;
    }
    const _Window_SavefileList_callUpdateHelp =
        Window_SavefileList.prototype.callUpdateHelp;
    Window_SavefileList.prototype.callUpdateHelp = function () {
        _Window_SavefileList_callUpdateHelp.apply(this, arguments);
        if (this.active && this.mzkp_statusWindow) {
            this.mzkp_statusWindow.setSavefileId(this.savefileId());
        }
    }
    function Window_SavefileStatus() {
        this.initialize.apply(this, arguments);
    }
    Window_SavefileStatus.prototype = Object.create(Window_Base.prototype);
    Window_SavefileStatus.prototype.constructor = Window_SavefileStatus;
    Window_SavefileStatus.prototype.initialize = function (rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._savefileId = 1;
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
    Window_SavefileStatus.prototype.drawTitle = function (savefileId, x, y) {
        if (savefileId === 0) this.drawText(TextManager.autosave, x, y, 180);
        else this.drawText(TextManager.file + " " + savefileId, x, y, 180);
    }
    Window_SavefileStatus.prototype.drawContents = function (info, rect) {
        const bottom = rect.y + rect.height;
        const playtimeY = bottom - this.lineHeight();
        this.drawText(info.title, rect.x + 192, rect.y, rect.width - 192);
        this.drawPartyfaces(info.faces, rect.x, bottom - 144);
        this.drawText(info.playtime, rect.x, playtimeY, rect.width, "right");
    }
    Window_SavefileStatus.prototype.drawPartyfaces = function (faces, x, y) {
        if (faces)
            for (let i = 0; i < faces.length; i++) {
                const data = faces[i];
                this.drawFace(data[0], data[1], x + i * 150, y);
            }
    }
    Window_SavefileList.prototype.drawPlaytime = function (info, x, y, width) {
        if (info.playtime) {
            let s = info.playtime;
            s = s.startsWith('00:') ? s.substring(3) : s.substring(0, 5);
            this.drawText(s, x, y, width, 'right');
        }
    }
})()