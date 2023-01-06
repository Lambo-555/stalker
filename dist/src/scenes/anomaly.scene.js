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
var AnomalyRoadScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyRoadScene = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const anomalies_entity_1 = require("../user/entities/anomalies.entity");
const artifacts_entity_1 = require("../user/entities/artifacts.entity");
const chapters_entity_1 = require("../user/entities/chapters.entity");
const choices_entity_1 = require("../user/entities/choices.entity");
const inventory_items_entity_1 = require("../user/entities/inventory_items.entity");
const progress_entity_1 = require("../user/entities/progress.entity");
const users_entity_1 = require("../user/entities/users.entity");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const activity_enum_1 = require("./enums/activity.enum");
const scenes_enum_1 = require("./enums/scenes.enum");
let AnomalyRoadScene = AnomalyRoadScene_1 = class AnomalyRoadScene {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, artifactsRepository, anomaliesRepository) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.artifactsRepository = artifactsRepository;
        this.anomaliesRepository = anomaliesRepository;
        this.logger = new common_1.Logger(AnomalyRoadScene_1.name);
    }
    async onRegister(ctx, next) {
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        if (user) {
            const progress = await this.progressRepository.findOne({
                where: { user_id: user.id },
            });
            if (!progress) {
                const lastChapter = await this.chaptersRepository.findOne({
                    order: { id: 1 },
                    where: { content: (0, typeorm_2.Like)('💭%') },
                });
                await this.progressRepository.save({
                    user_id: user.id,
                    chapter_id: lastChapter.id,
                });
            }
        }
        else {
            const userRegistered = await this.usersRepository.save({
                telegram_id: telegram_id,
            });
            const lastChapter = await this.chaptersRepository.findOne({
                order: { id: 1 },
                where: { content: (0, typeorm_2.Like)('💭') },
            });
            await this.progressRepository.save({
                user_id: userRegistered.id,
                chapter_id: lastChapter.id,
            });
            this.logger.debug(JSON.stringify(userRegistered, null, 2));
        }
        next();
    }
    async onSceneEnter(ctx) {
        const anomaliesList = await this.anomaliesRepository.find();
        await ctx.reply(`Вы попали в зону аномалии "${this.appService.getRandomElInArr(anomaliesList.map((item) => item.name))}". Вы кидаете болты, чтобы выжить и пройти дальше.`, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Выбор направления.', 'anomalyWays'),
        ]));
    }
    async anomalyWays(ctx) {
        const ways = [
            { name: 'Шаг влево', status: 'true' },
            { name: 'Шаг вправо', status: 'true' },
            { name: 'Кинуть болт', status: 'true' },
            { name: 'Прыгнуть', status: 'false' },
            { name: 'Проползти', status: 'false' },
            { name: 'Пробежать', status: 'false' },
            { name: 'Прокрасться', status: 'true' },
        ];
        await ctx.replyWithHTML(`<b>Пути:</b> `, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Шаг вперед', 'wayXXX' + 'true'),
            ...ways.map((way) => telegraf_1.Markup.button.callback(way.name, 'wayXXX' + way.status.toString(), Math.random() > 0.6)),
        ], {
            columns: 2,
        }));
    }
    async onChoose(ctx, next) {
        const match = ctx.match[0];
        if (!match)
            next();
        const wayStatus = match.split('XXX')[1];
        if (wayStatus == 'true') {
            console.log('matchmatch1', match);
        }
        else {
            console.log('matchmatchmatch2', match);
        }
        const wayTotal = Math.random() * 100;
        if (wayTotal < 10) {
            await ctx.replyWithHTML('Не сработало. Вы попали в аномалию и получили травму', telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Выбраться', 'anomalyWays'),
            ]));
        }
        if (wayTotal >= 20 && wayTotal < 20) {
            await ctx.replyWithHTML('Все ровно. Путь безопасен. Нужно двигаться дальше', telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Дальше', 'anomalyWays'),
            ]));
        }
        if (wayTotal >= 20 && wayTotal < 60) {
            await ctx.replyWithHTML('Аномалия создата тут тупик', telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Обойти', 'anomalyWays'),
            ]));
        }
        if (wayTotal >= 60) {
            await ctx.reply('Все как один болты ложились в роный путь. Вы выбрались');
            await ctx.scene.leave();
        }
    }
    async enterQuestScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.QUEST);
    }
    async market(ctx) {
    }
    async mystats(ctx) {
    }
    async mission(ctx) {
    }
    async job(ctx, next) {
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        await ctx.reply('Вы выбрались из аномальной зоны.');
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "onRegister", null);
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('anomalyWays'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "anomalyWays", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/wayXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "onChoose", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.QUEST),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "enterQuestScene", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('play'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "market", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('mystats'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "mystats", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('mission'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "mission", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(new RegExp(activity_enum_1.ActivityEnum.JOB + '.*', 'gm')),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "job", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "onLeaveCommand", null);
__decorate([
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnomalyRoadScene.prototype, "onSceneLeave", null);
AnomalyRoadScene = AnomalyRoadScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.ANOMALY_ROAD),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.Chapters)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.Choices)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_1.InjectRepository)(artifacts_entity_1.Artifacts)),
    __param(7, (0, typeorm_1.InjectRepository)(anomalies_entity_1.Anomalies)),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnomalyRoadScene);
exports.AnomalyRoadScene = AnomalyRoadScene;
//# sourceMappingURL=anomaly.scene.js.map