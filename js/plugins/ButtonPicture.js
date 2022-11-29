//=============================================================================
// RPG Maker MZ - Button Picture
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 点击图片触发公共事件
 * @author Yoji Ojima
 *
 * @help ButtonPicture.js
 * 本插件可以在显示图片以后为其绑定一个公共事件，点击时触发。
 * 使用步骤：
 * 1. 执行「显示图片」指令显示一张图片（比如说是个按钮形状）。
 * 2. 使用插件指令「Set Button Picture」为其绑定一个公共事件。
 *
 * @command set
 * @text Set Button Picture
 * @desc Makes the specified picture clickable.
 *
 * @arg pictureId
 * @type number
 * @min 1
 * @max 100
 * @default 1
 * @text Picture Number
 * @desc Control number of the picture.
 *
 * @arg commonEventId
 * @type common_event
 * @default 1
 * @text Common Event
 * @desc Common event to call when the picture is clicked.
 */
(() => {
    const pluginName = "ButtonPicture";
    PluginManager.registerCommand(pluginName, "set", args => {
        const pictureId = Number(args.pictureId);
        const commonEventId = Number(args.commonEventId);
        const picture = $gameScreen.picture(pictureId);
        if (picture) {
            picture.mzkp_commonEventId = commonEventId;
        }
    })
    Sprite_Picture.prototype.isClickEnabled = function() {
        const picture = this.picture();
        return picture && picture.mzkp_commonEventId && !$gameMessage.isBusy();
    }
    Sprite_Picture.prototype.onClick = function() {
        $gameTemp.reserveCommonEvent(this.picture().mzkp_commonEventId);
    }
    Spriteset_Base.prototype.mzkp_isAnyPicturePressed = function() {
        return this._pictureContainer.children.some(sprite => sprite.isPressed());
    }
    const _Scene_Map_isAnyButtonPressed =
        Scene_Map.prototype.isAnyButtonPressed;
    Scene_Map.prototype.isAnyButtonPressed = function() {
        return (
            _Scene_Map_isAnyButtonPressed.apply(this, arguments) ||
            this._spriteset.mzkp_isAnyPicturePressed()
        );
    }
})()