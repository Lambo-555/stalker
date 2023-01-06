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
var ArtefactScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtefactScene = void 0;
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
const scenes_enum_1 = require("./enums/scenes.enum");
let ArtefactScene = ArtefactScene_1 = class ArtefactScene {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, artifactsRepository, anomaliesRepository) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.artifactsRepository = artifactsRepository;
        this.anomaliesRepository = anomaliesRepository;
        this.logger = new common_1.Logger(ArtefactScene_1.name);
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
        const artList = await this.artifactsRepository.find();
        const randArt = this.appService.getRandomElInArr(artList);
        await ctx.reply(`Вы возле артефакта: "${randArt.name}". Нужно его правильно запереть в короб. Материал покрытия крайне важен.`, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Выбор короба.', 'artifactXXX' + randArt.anomaly),
        ]));
    }
    async onChoose(ctx, next) {
        const match = ctx.match[0];
        if (!match)
            next();
        console.log('anomalymatchanomaly', match);
        const anomalyId = +match.split('XXX')[1];
        console.log('anomalyanomaly', anomalyId);
        const anomalyAll = await this.anomaliesRepository.find();
        const anomalyTarget = anomalyAll.filter((item) => item.id === anomalyId)[0];
        const anomalyEffects = Array.from(new Set(anomalyAll.map((item) => item.effects)));
        await ctx.reply(`Аномалия, в которой находится артефакт: ${anomalyTarget.name}`, telegraf_1.Markup.inlineKeyboard([
            ...anomalyEffects.map((anomalyItem) => telegraf_1.Markup.button.callback(anomalyItem, anomalyItem === anomalyTarget.effects
                ? 'anomalyTrue'
                : 'anomalyFalse')),
            telegraf_1.Markup.button.callback('🍔Меню', 'menu'),
        ], {
            columns: 1,
        }));
    }
    async anomalyTrue(ctx) {
        const wayTotal = Math.random() * 100;
        if (wayTotal >= 60) {
            await ctx.reply('Отлично, короб подошел, артефакт ведет себя стабильно.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('🍔Меню', 'menu')]));
            await ctx.scene.leave();
        }
        else {
            await ctx.reply('Отлично, короб подошел, но артефакт был нестабилен и иссяк.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('🍔Меню', 'menu')]));
            await ctx.scene.leave();
        }
    }
    async anomalyFalse(ctx) {
        await ctx.reply('Короб не подошел, артефакт разрушен.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('🍔Меню', 'menu')]));
        await ctx.scene.leave();
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        await ctx.reply('Поиск артефакта завершен.');
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "onRegister", null);
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/artifactXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "onChoose", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('anomalyTrue'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "anomalyTrue", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('anomalyFalse'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "anomalyFalse", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "onLeaveCommand", null);
__decorate([
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtefactScene.prototype, "onSceneLeave", null);
ArtefactScene = ArtefactScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.ARTIFACT),
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
], ArtefactScene);
exports.ArtefactScene = ArtefactScene;
//# sourceMappingURL=artefact.scene.js.map