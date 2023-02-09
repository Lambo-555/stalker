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
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const anomalies_entity_1 = require("../user/entities/anomalies.entity");
const artifacts_entity_1 = require("../user/entities/artifacts.entity");
const chapters_entity_1 = require("../user/entities/chapters.entity");
const choices_entity_1 = require("../user/entities/choices.entity");
const inventory_items_entity_1 = require("../user/entities/inventory_items.entity");
const locations_entity_1 = require("../user/entities/locations.entity");
const progress_entity_1 = require("../user/entities/progress.entity");
const quests_entity_1 = require("../user/entities/quests.entity");
const roads_entity_1 = require("../user/entities/roads.entity");
const users_entity_1 = require("../user/entities/users.entity");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const scenes_enum_1 = require("./enums/scenes.enum");
let BanditScene = BanditScene_1 = class BanditScene {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, artifactsRepository, anomaliesRepository, locationsRepository, roadsRepository, questsEntity, bot) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.artifactsRepository = artifactsRepository;
        this.anomaliesRepository = anomaliesRepository;
        this.locationsRepository = locationsRepository;
        this.roadsRepository = roadsRepository;
        this.questsEntity = questsEntity;
        this.bot = bot;
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
    buttlePart(enemyList) {
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
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        const progress = await this.progressRepository.findOne({
            where: {
                user_id: user.id,
            },
        });
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Вернуться', 'menu'),
        ]).reply_markup;
        const enemies = this.generateRandomEnemies();
        let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
            .map((item) => item.name)
            .join(', ')}.\n`;
        log += this.buttlePart(enemies);
        log += '\nБой окончен!';
        this.appService.updateDisplay(progress, keyboard, log, 'https://sun9-40.userapi.com/impg/TdhFr4WwGgSQrY-68V5oP_iivWfv18ye2cs2UA/DQ5jU6dsKuM.jpg?size=1024x1024&quality=95&sign=314289bfceb91c4d013d1e4829d58d68&type=album');
        ctx.scene.leave();
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
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
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BanditScene.prototype, "onSceneLeave", null);
BanditScene = BanditScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.BANDIT),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.ChaptersEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.ChoicesEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.ProgressEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_1.InjectRepository)(artifacts_entity_1.Artifacts)),
    __param(7, (0, typeorm_1.InjectRepository)(anomalies_entity_1.Anomalies)),
    __param(8, (0, typeorm_1.InjectRepository)(locations_entity_1.LocationsEntity)),
    __param(9, (0, typeorm_1.InjectRepository)(roads_entity_1.RoadsEntity)),
    __param(10, (0, typeorm_1.InjectRepository)(quests_entity_1.QuestsEntity)),
    __param(11, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        telegraf_1.Telegraf])
], BanditScene);
exports.BanditScene = BanditScene;
//# sourceMappingURL=bandit.scene.js.map