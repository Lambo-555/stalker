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
        let logs = '';
        enemyList.forEach((enemyPos, index) => {
            logs += `Враг: ${enemyPos.name}\n`;
            const playerPos = { x: 0, y: 0 };
            const distance = this.calculateDistance(enemyPos, playerPos);
            const shoots = 3;
            logs += `Вы стреляете очередью по ${shoots} выстрелов.\n`;
            logs += 'Расстояние: ' + distance;
            let totalDamage = 0;
            for (let shootIndex = 1; shootIndex <= shoots; shootIndex++) {
                if (totalDamage >= 100) {
                    logs += '\nВраг ' + enemyPos.name + ' убит.';
                    enemyList.splice(index, 1);
                    break;
                }
                logs += '\nВыстрел' + shootIndex + ': ';
                const spread = this.calculateSpread(shootIndex, distance);
                const damage = this.calculateDamage(distance, 120);
                const chanceToShoot = 100 - spread;
                const shootIsOk = 100 * Math.random() <= chanceToShoot;
                if (shootIsOk)
                    totalDamage += damage;
                logs += 'Разброс: ' + spread + '%.  ';
                logs += 'Урон: ' + damage + 'хп. ';
                logs += 'Пападание: ' + (shootIsOk ? 'Есть!' : 'Мимо!');
            }
            logs += '\nИтоговый урон: ' + totalDamage + '\n\n';
            totalDamage = 0;
        });
        return { logs, enemyList };
    }
    async onSceneEnter(ctx) {
        var _a;
        let enemies = this.generateRandomEnemies();
        let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
            .map((item) => item.name)
            .join(', ')}.\n`;
        let battle = null;
        while (enemies.length !== 0) {
            battle = this.buttlePart(enemies);
            if (((_a = battle === null || battle === void 0 ? void 0 : battle.enemyList) === null || _a === void 0 ? void 0 : _a.length) >= 1) {
                enemies = battle === null || battle === void 0 ? void 0 : battle.enemyList;
            }
            log += battle.logs;
        }
        const message = await ctx.reply(log + '\nБой окончен!');
        try {
            setTimeout(() => {
                this.bot.telegram.deleteMessage(message.chat.id, message.message_id);
            }, 25000);
        }
        catch (error) {
            console.log(error);
        }
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