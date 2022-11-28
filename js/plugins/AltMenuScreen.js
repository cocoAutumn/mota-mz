//=============================================================================
// RPG Maker MZ - Alternative Menu Screen
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Alternative menu screen layout.
 * @author cocoAutumn
 *
 * @help AltMenuScreen.js
 *
 * This plugin changes the layout of the menu screen.
 * It puts the commands on the top and the status on the bottom.
 *
 * It does not provide plugin commands.
 */
(() => {
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
        this.contents.blt(
            ImageManager.loadFace(actor.faceName()),
            actor.faceIndex() % 4 * w, (actor.faceIndex() >>> 2) * h, w, h,
            rect.x, rect.y + lineHeight * 2, w * 1.5, h * 1.5
        );
    }
    Window_MenuStatus.prototype.drawItemStatus = function (index) {
        const actor = this.actor(index), rect = this.itemRectWithPadding(index), x = rect.x, y = rect.y;
        const width = rect.width, bottom = y + rect.height, lineHeight = this.lineHeight();
        this.drawActorName(actor, x, y, width);
        this.drawActorClass(actor, x + ImageManager.faceWidth, y, width);
        this.drawActorLevel(actor, x, y + lineHeight, width);
        this.placeGauge(actor, 'hp', x, bottom - lineHeight * 2);
        this.placeGauge(actor, 'mp', x + ImageManager.faceWidth, bottom - lineHeight * 2);
        this.drawActorIcons(actor, x, bottom - lineHeight - 4, width);
    }
})()