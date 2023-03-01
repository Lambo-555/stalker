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
    generatePlayerPosition() {
        const x = Math.floor(Math.random() * 1000);
        const y = Math.floor(Math.random() * 1000);
        return { x, y };
    }
    calculateDamage(distance, damage) {
        const calcDamage = damage - (distance / 50) ** 2 + Math.random() * 5 - 5;
        if (calcDamage <= 0)
            return 0;
        return Math.floor(calcDamage);
    }
    generateRandomEnemies() {
        const names = [
            'Васян',
            'Жора',
            'Борян',
            'Колян',
            'Стасик',
            'Петрос',
            'Роберт',
            'Андрюха',
            'Асти',
            'Максон',
            'Максан',
            'Денчик',
            'Витян',
        ];
        const surNames = [
            'Бобр',
            'Жесткий',
            'Кривой',
            'Зануда',
            'Мозила',
            'Пес',
            'Гангстер',
            'Черный',
            'Дикий',
            'Цепной',
            'Шальной',
            'Зеленый',
            'Маслинник',
        ];
        const enemies = [];
        const enemiesTargetCount = Math.floor(Math.random() * 2) + 1;
        while ((enemies === null || enemies === void 0 ? void 0 : enemies.length) !== enemiesTargetCount) {
            const x = Math.floor(Math.random() * 200);
            const y = Math.floor(Math.random() * 200);
            const nameIndex = Math.floor(Math.random() * (names === null || names === void 0 ? void 0 : names.length));
            const name = names[nameIndex];
            names.splice(nameIndex, 1);
            const surNameIndex = Math.floor(Math.random() * (names === null || names === void 0 ? void 0 : names.length));
            const surName = surNames[surNameIndex];
            surNames.splice(surNameIndex, 1);
            const pogonalo = `${name} ${surName}`;
            enemies.push({ x, y, name: pogonalo });
        }
        return enemies;
    }
    battlePart(enemyList) {
        const phrasesShot = [
            'Ай, мля',
            'Маслину поймал',
            'Епта',
            'Меня подбили, пацаны',
            'Погано то как',
            'Зацепило, пацаны',
        ];
        const phrasesMiss = [
            'Мозила',
            'Косой',
            'Баклан, ты мимо',
            'Ай, фаратнуло',
            'В молоко',
        ];
        let logs = '';
        let damageToEnemy = 0;
        let damageToPlayer = 0;
        while (enemyList.length !== 0) {
            const enemy = enemyList[0];
            const distancePlayers = this.calculateDistance(enemy, { x: 0, y: 0 });
            const spread = this.calculateSpread(1, distancePlayers);
            logs += `\nДистанция:${distancePlayers}. Разлетность: ${spread}%`;
            const phrasesIndex = Math.floor(Math.random() * phrasesShot.length);
            const phraseShot = phrasesShot[phrasesIndex];
            const phrasesMissIndex = Math.floor(Math.random() * phrasesMiss.length);
            const phraseMiss = phrasesMiss[phrasesMissIndex];
            const damageToEnemyNow = this.calculateDamage(distancePlayers, 120);
            const isShotToEnemy = Math.random() * 100 >= spread;
            if (isShotToEnemy) {
                logs += `\n${enemy.name}: ${phraseShot}\n`;
                damageToEnemy += damageToEnemyNow;
                logs += `Урон по врагу: ${damageToEnemyNow}\n`;
            }
            else {
                logs += `\n${enemy.name}: ${phraseMiss}\n`;
                logs += `Урон по врагу не прошел.\n`;
            }
            const damageToPlayerNow = this.calculateDamage(distancePlayers, 45);
            const isShotToPlayer = Math.random() * 100 >= spread;
            if (isShotToPlayer) {
                damageToPlayer += damageToPlayerNow;
                logs += `Ответный урон по вам: ${damageToPlayerNow}\n`;
            }
            else {
                logs += `Ответный урон по вам не прошел\n`;
            }
            if (damageToEnemy >= 75) {
                enemyList.splice(0, 1);
                logs += `${enemy.name} более не опасен...\n`;
                damageToEnemy = 0;
            }
            if (damageToPlayer >= 126) {
                enemyList.splice(0, 1);
                logs += `\nВы погибли...(На данном этапе это не влияет на прогресс)\n`;
                break;
            }
        }
        return logs;
    }
    async onSceneEnter(ctx) {
        const playerData = await this.appService.getStorePlayerData(ctx);
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Вернуться', scenes_enum_1.ScenesEnum.SCENE_QUEST),
        ]).reply_markup;
        const enemies = this.generateRandomEnemies();
        let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
            .map((item) => item.name)
            .join(', ')}.\n`;
        log += this.battlePart(enemies);
        log += '\nБой окончен!';
        this.appService.updateDisplay(playerData.playerProgress, keyboard, log, 'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album');
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_LOCATION);
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