//=============================================================================
// RPG Maker MZ - Alternative Save Screen
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Alternative save/load screen layout.
 * @author cocoAutumn
 *
 * @param maxSavefiles
 * @text max save files
 * @desc How many save files (including autosave) the player can have.
 * @type number
 * @default 50
 * @min 1
 * @max 1000
 * 
 * @param maxRows
 * @text max rows
 * @desc How many rows in one page to show save files.
 * @type number
 * @default 5
 * @min 1
 * @max 5
 * 
 * @param maxCols
 * @text max columns
 * @desc How many columns in one page to show save files.
 * @type number
 * @default 10
 * @min 1
 * @max 10
 * 
 * @help AltSaveScreen.js
 *
 * This plugin changes the layout of the save/load screen.
 * It puts the file list on the top and the details on the bottom.
 *
 * It does not provide plugin commands.
 */

(() => {
    const param  = PluginManager.parameters('AltSaveScreen');
    DataManager.maxSavefiles = () => param.maxSavefiles;

    const _Scene_File_create = Scene_File.prototype.create;
    Scene_File.prototype.create = function() {
        _Scene_File_create.apply(this, arguments);
        this._listWindow.height = this._listWindow.fittingHeight(param.maxRows);
        const x = 0;
        const y = this._listWindow.y + this._listWindow.height;
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight - y;
        const rect = new Rectangle(x, y, width, height);
        const statusWindow = new Window_SavefileStatus(rect);
        this._listWindow.mzkp_statusWindow = statusWindow;
        this.addWindow(statusWindow);
    };

    const _Scene_File_start = Scene_File.prototype.start;
    Scene_File.prototype.start = function() {
        _Scene_File_start.apply(this, arguments);
        this._listWindow.ensureCursorVisible();
        this._listWindow.callUpdateHelp();
    };

    Window_SavefileList.prototype.windowWidth = function() {
        return Graphics.boxWidth;
    };

    Window_SavefileList.prototype.maxCols = () => param.maxCols;

    Window_SavefileList.prototype.itemHeight = function() {
        return this.lineHeight() * 2 + 16;
    };

    const _Window_SavefileList_callUpdateHelp =
        Window_SavefileList.prototype.callUpdateHelp;
    Window_SavefileList.prototype.callUpdateHelp = function() {
        _Window_SavefileList_callUpdateHelp.apply(this, arguments);
        if (this.active && this.mzkp_statusWindow) {
            this.mzkp_statusWindow.setSavefileId(this.savefileId());
        }
    };

    function Window_SavefileStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_SavefileStatus.prototype = Object.create(Window_Base.prototype);
    Window_SavefileStatus.prototype.constructor = Window_SavefileStatus;

    Window_SavefileStatus.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._savefileId = 1;
    };

    Window_SavefileStatus.prototype.setSavefileId = function(id) {
        this._savefileId = id;
        this.refresh();
    };

    Window_SavefileStatus.prototype.refresh = function() {
        const info = DataManager.savefileInfo(this._savefileId);
        const rect = this.contents.rect;
        this.contents.clear();
        this.resetTextColor();
        this.drawTitle(this._savefileId, rect.x, rect.y);
        if (info) {
            this.drawContents(info, rect);
        }
    };

    Window_SavefileStatus.prototype.drawTitle = function(savefileId, x, y) {
        if (savefileId === 0) {
            this.drawText(TextManager.autosave, x, y, 180);
        } else {
            this.drawText(TextManager.file + " " + savefileId, x, y, 180);
        }
    };

    Window_SavefileStatus.prototype.drawContents = function(info, rect) {
        const bottom = rect.y + rect.height;
        const playtimeY = bottom - this.lineHeight();
        this.drawText(info.title, rect.x + 192, rect.y, rect.width - 192);
        this.drawPartyfaces(info.faces, rect.x, bottom - 144);
        this.drawText(info.playtime, rect.x, playtimeY, rect.width, "right");
    };

    Window_SavefileStatus.prototype.drawPartyfaces = function (faces, x, y) {
        const w = ImageManager.faceWidth, h = ImageManager.faceHeight;
        if (faces)
            for (let i = 0; i < faces.length; i++)
                this.contents.blt(
                    ImageManager.loadFace(faces[i][0]),
                    faces[i][1] % 4 * h, (faces[i][1] >>> 2) * h, w, h,
                    x + i * 150 * 2, y - 144, w * 2, h * 2
                );
    };
})();
