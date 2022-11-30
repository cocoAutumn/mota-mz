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
 * 1. 角色八项属性与职业和等级解绑：
 * RPG Maker的默认行为是，双上限、双攻双防、敏捷幸运，这八项属性的基础值
 * 只受职业和等级影响，而通过补药或事件永久增减这些值则是另一回事。
 * 对魔塔来说我们不需要前者，因此本插件屏蔽了那部分基础值。
 * 
 * 2. 魔塔战斗系统：
 */
(() => {
    // 1. 角色八项参数与职业和等级解绑，还有一个ParamBasePlus是下面两项相加
    Game_Actor.prototype.paramBase = function (paramId) { // 补药和事件的永久增减
        // return this.currentClass().params[paramId][this._level];
        return this._paramPlus[paramId]; // 直接对该项赋值就可以实现「过场重置属性」
    };
    Game_Actor.prototype.paramPlus = function (paramId) { // 装备的常数增减
        // let value = Game_Battler.prototype.paramPlus.call(this, paramId);
        let value = 0;
        for (const item of this.equips()) if (item) value += item.params[paramId];
        return value;
    };

    // 2. 魔塔战斗系统
    Game_Party.prototype.calcBattleDamage = function (troop, x, y) {
        if (typeof troop === 'string')
            if (troop.startsWith('[') && troop.endsWith(']'))
                troop = troop.substring(1, troop.length - 1).split(',')
            else
                troop = [troop];
        troop = troop.map(id => $dataEnemies[id]);
    }
})()