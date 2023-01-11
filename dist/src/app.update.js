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
var AppUpdate_1;
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const users_entity_1 = require("./user/entities/users.entity");
const app_service_1 = require("./app.service");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const chapters_entity_1 = require("./user/entities/chapters.entity");
const choices_entity_1 = require("./user/entities/choices.entity");
const progress_entity_1 = require("./user/entities/progress.entity");
const inventory_items_entity_1 = require("./user/entities/inventory_items.entity");
const scenes_enum_1 = require("./scenes/enums/scenes.enum");
const locations_entity_1 = require("./user/entities/locations.entity");
let AppUpdate = AppUpdate_1 = class AppUpdate {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, locationsRepository) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.locationsRepository = locationsRepository;
        this.logger = new common_1.Logger(AppUpdate_1.name);
        this.secret = 'bcryptersss';
    }
    onApplicationBootstrap() {
        this.appService.commandListInit();
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
                    where: { content: (0, typeorm_1.Like)('💭%') },
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
                where: { content: (0, typeorm_1.Like)('💭') },
            });
            await this.progressRepository.save({
                user_id: userRegistered === null || userRegistered === void 0 ? void 0 : userRegistered.id,
                chapter_id: (lastChapter === null || lastChapter === void 0 ? void 0 : lastChapter.id) || 50,
            });
            this.logger.debug(JSON.stringify(userRegistered, null, 2));
        }
        next();
    }
    async onMenu(ctx) {
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        const progress = await this.progressRepository.findOne({
            where: { user_id: user.id },
        });
        const userChapterId = progress.chapter_id;
        let userChapter = await this.chaptersRepository.findOne({
            where: { id: userChapterId },
        });
        const nextChoices = await this.choicesRepository.find({
            where: { chapter_id: userChapter.id },
        });
        const starterChapter = await this.chaptersRepository.findOne({
            order: { id: 1 },
            where: { content: (0, typeorm_1.Like)('💭%') },
        });
        if (!userChapter && starterChapter) {
            userChapter = starterChapter;
        }
        const locations = await this.locationsRepository.findOne({
            where: { id: user.location },
        });
        const nextChapter = await this.chaptersRepository.findOne({
            where: { id: progress.chapter_id, location: locations.id },
        });
        await ctx.replyWithHTML(`Вы на локации: <b>${locations.name}</b>.`, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('🔩Аномалия', scenes_enum_1.ScenesEnum.ANOMALY_ROAD),
            telegraf_1.Markup.button.callback('🐫Мутант', scenes_enum_1.ScenesEnum.MUTANT),
            telegraf_1.Markup.button.callback('🥦Артефакт', scenes_enum_1.ScenesEnum.ARTIFACT),
            telegraf_1.Markup.button.callback('📍Перемещение', scenes_enum_1.ScenesEnum.LOCATION),
            telegraf_1.Markup.button.callback('📟PDA', 'PDA'),
            telegraf_1.Markup.button.callback('🤙Квест', scenes_enum_1.ScenesEnum.QUEST, !!!nextChapter),
        ], {
            columns: 2,
        }));
    }
    async enterPdaScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.PDA);
    }
    async enterAnomalyRoadScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.ANOMALY_ROAD);
    }
    async enterMutantScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.MUTANT);
    }
    async enterArtefactScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.ARTIFACT);
    }
    async enterLocationScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.LOCATION);
    }
    async enterQuestScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.QUEST);
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "onRegister", null);
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    (0, nestjs_telegraf_1.Action)('menu'),
    (0, nestjs_telegraf_1.Command)('menu'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "onMenu", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.PDA),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.PDA),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterPdaScene", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.ANOMALY_ROAD),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.ANOMALY_ROAD),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterAnomalyRoadScene", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.MUTANT),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.MUTANT),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterMutantScene", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.ARTIFACT),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.ARTIFACT),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterArtefactScene", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.LOCATION),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.LOCATION),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterLocationScene", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.QUEST),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.QUEST),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterQuestScene", null);
AppUpdate = AppUpdate_1 = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(users_entity_1.Users)),
    __param(2, (0, typeorm_2.InjectRepository)(chapters_entity_1.Chapters)),
    __param(3, (0, typeorm_2.InjectRepository)(choices_entity_1.Choices)),
    __param(4, (0, typeorm_2.InjectRepository)(progress_entity_1.Progress)),
    __param(5, (0, typeorm_2.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_2.InjectRepository)(locations_entity_1.LocationsEntity)),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], AppUpdate);
exports.default = AppUpdate;
//# sourceMappingURL=app.update.js.map