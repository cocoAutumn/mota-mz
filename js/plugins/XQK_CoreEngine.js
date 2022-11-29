/*:
 * @target MZ
 * @plugindesc 一些不止可以用于魔塔的丰富扩展功能
 * @author 小秋葵
 *
 * @help XQK_CoreEngine.js
 * 本插件提供了大量对RMMZ运行时的功能扩展以及对其一些默认行为的优化，
 * 使用时需要依赖官方插件PluginCommonBase.js和TextScriptBase.js。
 * 
 * 1. 64*64素材支持：
 * 在「数据库-系统2」中将图块大小设为32*32后，运行时加载tileset将实际读取
 * 'img/tile64/'目录下的文件，游戏效果每格为64*64。
 *  推荐在'img/tilesets/'目录放置「RPG Maker VX和VX Ace」的tileset文件
 * （Steam可以免费下载RMVA的Lite版本），然后用imagemagick等工具将它们放大一倍后
 * 放进'img/tile64/'目录。
 * 远景图（parallaxes）理论上也可以进行类似的处理，如果您一定要在编辑器中预览。
 * 
 * 2. 转义序列增强：
 * 现在你可以在转义序列的方括号中使用数字、字母、下划线了，如果以下划线开头，
 * 则下划线之后的部分会被解释为一个字符串，比如\C[_RRGGBB]可以设置任意文字颜色，
 * \I[_xxx]可以根据xxx来绘制不属于IconSet.png的图标。
 */
(() => {
    // 1. 64*64素材支持
    Game_Map.prototype.tileWidth = () => 'tileSize' in $dataSystem ? $dataSystem.tileSize * 2 : 48;
    ImageManager.loadTileset = function (filename) { return this.loadBitmap('img/tile64/', filename) }

    // 2. 转义序列增强，支持\C[_RRGGBB]变色和额外的IconSet图标
    Window_Base.prototype.obtainEscapeParam = function (textState) {
        const regExp = /^\[\w+\]/; // 转义序列的方括号内支持数字、字母、下划线
        const arr = regExp.exec(textState.text.slice(textState.index));
        if (arr) {
            textState.index += arr[0].length;
            if (arr[0].startsWith('[_')) return arr[0].substring(2, arr[0].length - 1); // 下划线开头
            return parseInt(arr[0].slice(1));
        } else {
            return "";
        }
    };
    Window_Base.prototype.processColorChange = function (colorIndex) { // \C[n]变色增强，支持RGB值
        if (typeof colorIndex === 'string') this.changeTextColor('#' + colorIndex);
        else this.changeTextColor(ColorManager.textColor(colorIndex));
    };
    let drawIcon = Window_Base.prototype.drawIcon;
    Window_Base.prototype.drawIcon = function (iconIndex, x, y) {
        if (typeof iconIndex === 'number') return drawIcon.apply(this, arguments);
        // TODO: 否则iconIndex为字符串，请自由发挥
    };
})()