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
        return Math.max(Math.floor(gun.baseDamage - (Math.abs(gun.optimalDistance - distance) / 15) ** 2), 0);
    }
    calculateSpreadForGun(gun, distance) {
        return (100 -
            Math.max(Math.floor(gun.baseDamage - (Math.abs(gun.optimalDistance - distance) / 30) ** 2), 0));
    }
    calculateDistance(posOne, posTwo) {
        const deltaX = posTwo.x - posOne.x;
        const deltaY = posTwo.y - posOne.y;
        return Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY)) + 1;
    }
    calculateSpread(shotsPrev, distance) {
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
        const toLen = 5;
        return '_'.repeat(toLen - coordLen) + coord.toString();
    }
    moveEnemyByGun(player, enemy) {
        const diffDistance = this.calculateDistance(enemy.position, player.position);
        const posXDiff = enemy.position.x - player.position.x;
        const posYDiff = enemy.position.y - player.position.y;
        const posXPositive = Math.abs(posXDiff);
        const posYPositive = Math.abs(posYDiff);
        const moveXDist = posXPositive >= 20 ? 20 : posXPositive;
        const moveYDist = posYPositive >= 20 ? 20 : posYPositive;
        if (diffDistance > enemy.gun.optimalDistance) {
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
        const match = ctx.match[0];
        const enemyName = match.split('XXX')[1];
        const storePlayerData = await this.appService.getStorePlayerData(ctx);
        let text = '';
        const enemyList = await this.appService.getBattleEnemyList(ctx);
        const currentEnemy = enemyList.filter((item) => item.name === enemyName)[0];
        const currentEnemyIndex = enemyList.findIndex((item) => item.name === enemyName);
        if (!currentEnemy)
            ctx.scene.reenter();
        const battlePlayer = await this.appService.getBattlePlayer(ctx);
        if (!battlePlayer)
            console.error('NO PLAYER HERE');
        const distance = this.calculateDistance(battlePlayer.position, currentEnemy.position);
        const damage = this.calculateDamageForGun(battlePlayer.gun, distance);
        const spread = this.calculateSpreadForGun(battlePlayer.gun, distance);
        const isSuccessAttack = Math.random() * 100 > spread;
        if (isSuccessAttack) {
            text += `Противник ${currentEnemy.name} получил ранения от '${battlePlayer.gun.name}' ${damage}hp на расстоянии ${distance}m.\n`;
            currentEnemy.health = currentEnemy.health - damage;
            if (currentEnemy.health <= 0) {
                currentEnemy.isAlive = false;
                text += `${currentEnemy.name} более не опасен\n`;
            }
            else {
                text += `У ${currentEnemy.name} осталось ${currentEnemy.health}hp\n`;
            }
            enemyList[currentEnemyIndex] = currentEnemy;
            ctx.scene.state[storePlayerData.player.telegram_id].enemyList = enemyList;
        }
        if (!isSuccessAttack) {
            text += `Противник ${currentEnemy.name} находится на расстоянии ${distance}m. Шанс попадания ${100 - spread}%.\n`;
            text += `Вы промахнулись по цели: ${currentEnemy.name}\n`;
        }
        let keyboard = null;
        ctx.scene.state[storePlayerData.player.telegram_id].enemyList =
            enemyList.filter((enemy) => enemy.isAlive);
        const allEnemyIsDead = !!ctx.scene.state[storePlayerData.player.telegram_id].enemyList.length;
        if (allEnemyIsDead && battlePlayer.health >= 0) {
            text += 'Все противники побеждены. Хорошая работа, сталкер';
            keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Вернуться', scenes_enum_1.ScenesEnum.SCENE_QUEST),
            ]).reply_markup;
        }
        if (!allEnemyIsDead && battlePlayer.health >= 0) {
            keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('⬆️50m', 'goBack'),
                telegraf_1.Markup.button.callback('⬅️50m', 'goLeft'),
                telegraf_1.Markup.button.callback('⬇️50m', 'goForward'),
                telegraf_1.Markup.button.callback('➡️50m', 'goRight'),
                ...ctx.scene.state[storePlayerData.player.telegram_id].enemyList
                    .filter((enemy) => enemy.isAlive)
                    .map((enemyItem) => telegraf_1.Markup.button.callback('🎯' + enemyItem.name, 'attackXXX' + enemyItem.name)),
            ], {
                columns: 2,
            }).reply_markup;
        }
        if (battlePlayer.health <= 0) {
            text += 'Противники победили. Зона забрала вас';
            keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Вернуться', scenes_enum_1.ScenesEnum.SCENE_QUEST),
            ]).reply_markup;
        }
        this.appService.updateDisplay(storePlayerData.playerProgress, keyboard, text, 'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album');
    }
    async onMove(ctx) {
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
        log += `[➡️: ${this.formatCoord(battleData.battle.battlePlayer.position.x)}, ⬆️: ${this.formatCoord(battleData.battle.battlePlayer.position.y)}] - ваши координаты.\n`;
        await this.appService.updateBattleEnemyList(ctx, battleData.battle.enemyList.map((enemy) => this.moveEnemyByGun(battleData.battle.battlePlayer, enemy)));
        battleData = await this.appService.getBattle(ctx);
        const enemyAway = battleData.battle.enemyList.filter((enemy) => {
            const dist = this.calculateDistance(battleData.battle.battlePlayer.position, enemy.position);
            console.log('distdistPL', battleData.battle.battlePlayer.position);
            console.log('distdistEN', enemy.position);
            console.log('distdist', dist);
            return dist <= 500;
        });
        if (enemyAway.length === 0) {
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Сбежать', 'leave'),
            ]).reply_markup;
            this.appService.updateDisplay(battleData.playerProgress, keyboard, 'Вы ушли достаточно далеко', 'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album');
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
        let log = `Вам на пути встретились бандиты. Началась перестрелка. Чтобы сбежать отдалитесь от противника на 500м. \n`;
        log += `\n[➡️: ${this.formatCoord(battleData.battle.battlePlayer.position.x)}, ⬆️: ${this.formatCoord(battleData.battle.battlePlayer.position.y)}] - ваши координаты. В руках у вас ${battleData.battle.battlePlayer.gun.name}.\n`;
        log += this.getEnemiesPositions(battleData.battle.enemyList, battleData.battle.battlePlayer);
        this.appService.updateDisplay(playerData.playerProgress, keyboard, log, 'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album');
    }
    getEnemiesPositions(enemyList, player) {
        let text = '\n';
        let enemyPosText = '';
        for (let i = 0; i < enemyList.length; i++) {
            const enemy = enemyList[i];
            const distance = this.calculateDistance(player.position, enemy.position);
            enemyPosText += `\n[➡️: ${this.formatCoord(enemy.position.x)}, ⬆️: ${this.formatCoord(enemy.position.y)}] - координаты ${enemy.name}. Он находится на расстоянии ${distance}.`;
            enemyPosText += ` В руках: ${enemy.gun.name}.\n`;
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
        return;
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