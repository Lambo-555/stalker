"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BanditScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanditScene = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const telegraf_1 = require("telegraf");
const scenes_enum_1 = require("./enums/scenes.enum");
let BanditScene = BanditScene_1 = class BanditScene {
    constructor(appService) {
        this.appService = appService;
        this.logger = new common_1.Logger(BanditScene_1.name);
        this.navigationKeyboard = [
            telegraf_1.Markup.button.callback('⬆️50m', 'moveXXX' + '⬆️'),
            telegraf_1.Markup.button.callback('⬅️50m', 'moveXXX' + '⬅️'),
            telegraf_1.Markup.button.callback('⬇️50m', 'moveXXX' + '⬇️'),
            telegraf_1.Markup.button.callback('➡️50m', 'moveXXX' + '➡️'),
        ];
    }
    calculateDamageForGun(gun, distance) {
        return Math.max(Math.floor(gun.base_damage -
            (((Math.abs(gun.optimal_distance - distance) / 15) *
                gun.optimal_modifier) /
                100) **
                2), 0);
    }
    calculateSpreadForGun(gun, distance) {
        return (100 -
            Math.max(Math.floor(gun.base_damage -
                (Math.abs(gun.optimal_distance - distance) / 30) ** 2), 0));
    }
    calculateDistance(posOne, posTwo) {
        const deltaX = posTwo.x - posOne.x;
        const deltaY = posTwo.y - posOne.y;
        return Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY)) + 1;
    }
    calculateSpreadByRounds(shotsPrev, distance) {
        if (distance > 2000)
            return 100;
        const spread = Math.floor(shotsPrev * distance ** 0.6);
        if (spread >= 100)
            return 100;
        return spread;
    }
    calculateDamage(distance, damage) {
        const calcDamage = damage - (distance / 50) ** 2 + Math.random() * 5 - 5;
        if (calcDamage <= 0)
            return 0;
        return Math.floor(calcDamage);
    }
    formatCoord(coord) {
        const coordLen = coord.toString().length;
        return coord.toString();
    }
    moveEnemyByGun(player, enemy) {
        const diffDistance = this.calculateDistance(enemy.position, player.position);
        const posXDiff = enemy.position.x - player.position.x;
        const posYDiff = enemy.position.y - player.position.y;
        const posXPositive = Math.abs(posXDiff);
        const posYPositive = Math.abs(posYDiff);
        const moveXDist = posXPositive >= 20 ? 20 : posXPositive;
        const moveYDist = posYPositive >= 20 ? 20 : posYPositive;
        if (diffDistance > enemy.gun.optimal_distance) {
            enemy.position.x += posXDiff >= 0 ? -1 * moveXDist : moveXDist;
            enemy.position.y += posYDiff >= 0 ? -1 * moveYDist : moveYDist;
        }
        else {
            enemy.position.x += posXDiff >= 0 ? moveXDist : -1 * moveXDist;
            enemy.position.y += posYDiff >= 0 ? moveYDist : -1 * moveYDist;
        }
        return enemy;
    }
    async attackEnemy(ctx) {
        var _a;
        const match = ctx.match[0];
        const enemyName = match.split('XXX')[1];
        const storePlayerData = await this.appService.getStorePlayerData(ctx);
        let text = '';
        let battleData = await this.appService.getBattle(ctx);
        const currentEnemy = battleData.battle.enemyList.filter((item) => item.name === enemyName)[0];
        const currentEnemyIndex = battleData.battle.enemyList.findIndex((item) => item.name === enemyName);
        if (!currentEnemy)
            ctx.scene.reenter();
        const distance = this.calculateDistance(battleData.battle.battlePlayer.position, currentEnemy.position);
        const playerDamage = this.calculateDamageForGun(battleData.battle.battlePlayer.gun, distance);
        const enemyDamage = this.calculateDamageForGun(currentEnemy.gun, distance);
        const playerSpread = this.calculateSpreadForGun(battleData.battle.battlePlayer.gun, distance);
        const enemySpread = this.calculateSpreadForGun(currentEnemy.gun, distance);
        const isSuccessAttack = Math.random() * 100 > playerSpread;
        if (isSuccessAttack) {
            text += `Противник ${currentEnemy.name} получил ранения от '${battleData.battle.battlePlayer.gun.name}' ${playerDamage}hp на расстоянии ${distance}m.\n`;
            currentEnemy.health = currentEnemy.health - playerDamage;
            if (currentEnemy.health <= 0) {
                currentEnemy.isAlive = false;
                text += `${currentEnemy.name} более не опасен\n`;
            }
            else {
                text += `У ${currentEnemy.name} осталось ${currentEnemy.health}hp\n`;
            }
            battleData.battle.enemyList[currentEnemyIndex] = currentEnemy;
            ctx.scene.state[storePlayerData.player.telegram_id].enemyList =
                battleData.battle.enemyList;
        }
        if (!isSuccessAttack) {
            text += `Противник ${currentEnemy.name} находится на расстоянии ${distance}m. Шанс попадания ${100 - playerSpread}%.\n`;
            text += `Вы промахнулись по цели: ${currentEnemy.name}\n`;
        }
        const isSuccessCounterAttack = Math.random() * 100 > enemySpread;
        if (isSuccessCounterAttack) {
            text += `\nПротивник ${currentEnemy.name} выстрелил в вас в ответ из '${currentEnemy.gun.name}' ${enemyDamage}hp на расстоянии ${distance}m.\n`;
            battleData.battle.battlePlayer.health =
                battleData.battle.battlePlayer.health - enemyDamage;
            if (battleData.battle.battlePlayer.health <= 0) {
                battleData.battle.battlePlayer.isAlive = false;
                text += `Ущерб был летальным\n`;
            }
            if (battleData.battle.battlePlayer.health > 0) {
                text += `У вас осталось ${battleData.battle.battlePlayer.health}hp\n`;
            }
        }
        if (!isSuccessCounterAttack) {
            text += `Противник промахнулся\n`;
        }
        let keyboard = null;
        await this.appService.updateBattleEnemyList(ctx, battleData.battle.enemyList.filter((enemy) => enemy.isAlive));
        battleData = await this.appService.getBattle(ctx);
        const allEnemyIsDead = battleData.battle.enemyList.filter((item) => item.isAlive).length === 0;
        if (allEnemyIsDead && battleData.battle.battlePlayer.health >= 0) {
            text += 'Все противники побеждены. Хорошая работа, сталкер';
            keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Вернуться', scenes_enum_1.ScenesEnum.SCENE_QUEST),
            ]).reply_markup;
        }
        if (!allEnemyIsDead && battleData.battle.battlePlayer.health >= 0) {
            keyboard = telegraf_1.Markup.inlineKeyboard([
                ...this.navigationKeyboard,
                ...battleData.battle.enemyList
                    .filter((enemy) => enemy.isAlive)
                    .map((enemyItem) => telegraf_1.Markup.button.callback('🎯' + enemyItem.name, 'attackXXX' + enemyItem.name)),
            ], {
                columns: 2,
            }).reply_markup;
        }
        if (battleData.battle.battlePlayer.health <= 0) {
            text += 'Противники победили. Зона забрала вас';
            keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Вернуться', scenes_enum_1.ScenesEnum.SCENE_QUEST),
            ]).reply_markup;
        }
        this.appService.updateDisplay(storePlayerData.playerProgress, keyboard, text, (_a = storePlayerData === null || storePlayerData === void 0 ? void 0 : storePlayerData.playerLocation) === null || _a === void 0 ? void 0 : _a.image);
    }
    async onMove(ctx) {
        var _a;
        const match = ctx.match[0];
        const direction = match.split('XXX')[1];
        if (!direction) {
            await ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_QUEST);
        }
        let battleData = await this.appService.getBattle(ctx);
        let log = `Вы передвинулись ${direction} на 50m.\n\n`;
        await this.appService.updateBattleEnemyList(ctx, battleData.battle.enemyList);
        if (direction === '⬆️')
            battleData.battle.battlePlayer.position.y =
                battleData.battle.battlePlayer.position.y + 50;
        if (direction === '⬇️')
            battleData.battle.battlePlayer.position.y =
                battleData.battle.battlePlayer.position.y - 50;
        if (direction === '⬅️')
            battleData.battle.battlePlayer.position.x =
                battleData.battle.battlePlayer.position.x - 50;
        if (direction === '➡️')
            battleData.battle.battlePlayer.position.x =
                battleData.battle.battlePlayer.position.x + 50;
        battleData.battle.battlePlayer = await this.appService.updateBattlePlayer(ctx, battleData.battle.battlePlayer);
        log += `У вас в руках ${battleData.battle.battlePlayer.gun.name}. Оптимальная дистанция, чтобы спустить курок ${battleData.battle.battlePlayer.gun.optimal_distance}m.\n`;
        await this.appService.updateBattleEnemyList(ctx, battleData.battle.enemyList.map((enemy) => this.moveEnemyByGun(battleData.battle.battlePlayer, enemy)));
        battleData = await this.appService.getBattle(ctx);
        const enemyAway = battleData.battle.enemyList.filter((enemy) => {
            const dist = this.calculateDistance(battleData.battle.battlePlayer.position, enemy.position);
            console.log('playerPos', battleData.battle.battlePlayer.position);
            console.log('enemy_Pos', enemy.position);
            console.log('distance:', dist);
            return dist <= 500;
        });
        if (enemyAway.length === 0) {
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Сбежать', 'leave'),
            ]).reply_markup;
            this.appService.updateDisplay(battleData.playerProgress, keyboard, 'Вы ушли достаточно далеко', (_a = battleData === null || battleData === void 0 ? void 0 : battleData.playerLocation) === null || _a === void 0 ? void 0 : _a.image);
        }
        if (enemyAway.length !== 0) {
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                ...this.navigationKeyboard,
                ...battleData.battle.enemyList
                    .filter((enemy) => enemy.isAlive)
                    .map((enemyItem) => telegraf_1.Markup.button.callback('🎯' + enemyItem.name, 'attackXXX' + enemyItem.name)),
            ], {
                columns: 2,
            }).reply_markup;
            log +=
                this.getEnemiesPositions(battleData.battle.enemyList, battleData.battle.battlePlayer) + '\n';
            this.appService.updateDisplay(battleData.playerProgress, keyboard, log, 'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album');
        }
    }
    async onSceneEnter(ctx) {
        var _a;
        const playerData = await this.appService.getStorePlayerData(ctx);
        const battleData = await this.appService.createBattle(ctx);
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            ...this.navigationKeyboard,
            ...battleData.battle.enemyList
                .filter((enemy) => enemy.isAlive)
                .map((enemyItem) => telegraf_1.Markup.button.callback('🎯' + enemyItem.name, 'attackXXX' + enemyItem.name)),
        ], {
            columns: 2,
        }).reply_markup;
        let log = `Вам на пути встретился противник - ${battleData.battle.enemyList[0].group}. Началась перестрелка. Чтобы сбежать отдалитесь на 500м. \n`;
        log += `У вас в руках ${battleData.battle.battlePlayer.gun.name}. Оптимальная дистанция, чтобы спустить курок ${battleData.battle.battlePlayer.gun.optimal_distance}m.`;
        log += this.getEnemiesPositions(battleData.battle.enemyList, battleData.battle.battlePlayer);
        this.appService.updateDisplay(playerData.playerProgress, keyboard, log, (_a = playerData === null || playerData === void 0 ? void 0 : playerData.playerLocation) === null || _a === void 0 ? void 0 : _a.image);
    }
    getEnemiesPositions(enemyList, player) {
        let text = '\n';
        let enemyPosText = '';
        for (let i = 0; i < enemyList.length; i++) {
            const enemy = enemyList[i];
            const distance = this.calculateDistance(player.position, enemy.position);
            const difX = enemy.position.x - player.position.x;
            const difY = enemy.position.y - player.position.y;
            const xSmile = difX == 0 ? '↔️' : difX < 0 ? '⬅️️' : '➡️';
            const ySmile = difY == 0 ? '↕️' : difY < 0 ? '⬇️' : '⬆️';
            enemyPosText += `\n${xSmile} ${this.formatCoord(Math.abs(difX))}m,`;
            enemyPosText += `  ${ySmile} ${this.formatCoord(Math.abs(difY))}m`;
            enemyPosText += ` - отдаление врага ${enemy.name}.\nОн находится на расстоянии 🏃 ${distance}m.\n`;
            enemyPosText += `В руках у него ${enemy.gun.name}.\nОптимальная дистанция его стрельбы ${enemy.gun.optimal_distance}m.\n`;
            text += enemyPosText;
            enemyPosText = '';
        }
        return text;
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_QUEST);
    }
    async enterBanditScene(ctx) {
        const match = ctx.match[0];
        if (match) {
            const scene = match;
            await ctx.scene.enter(scene);
        }
    }
};
__decorate([
    (0, nestjs_telegraf_1.Action)(/^attackXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BanditScene.prototype, "attackEnemy", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^moveXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BanditScene.prototype, "onMove", null);
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BanditScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BanditScene.prototype, "onLeaveCommand", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^scene.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BanditScene.prototype, "enterBanditScene", null);
BanditScene = BanditScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.SCENE_BANDIT),
    __metadata("design:paramtypes", [app_service_1.AppService])
], BanditScene);
exports.BanditScene = BanditScene;
//# sourceMappingURL=bandit.scene.js.map