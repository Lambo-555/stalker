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
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, locationsRepository, bot) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.locationsRepository = locationsRepository;
        this.bot = bot;
        this.logger = new common_1.Logger(AppUpdate_1.name);
    }
    onApplicationBootstrap() {
        this.appService.commandListInit();
    }
    async onRegister(ctx, next) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const messageID = (_b = (_a = ctx === null || ctx === void 0 ? void 0 : ctx.update) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message_id;
            const chatID = (_d = (_c = ctx === null || ctx === void 0 ? void 0 : ctx.update) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.chat.id;
            const menuMessage = (_f = (_e = ctx === null || ctx === void 0 ? void 0 : ctx.update) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.text;
            if (menuMessage === '/menu' && chatID && messageID) {
                await this.bot.telegram.deleteMessage(chatID, messageID);
            }
            const telegram_id = this.appService.getTelegramId(ctx);
            let user = await this.usersRepository.findOne({
                where: { telegram_id: telegram_id },
            });
            let progress = await this.progressRepository.findOne({
                where: { user_id: user === null || user === void 0 ? void 0 : user.id },
            });
            if (!user) {
                const location = await this.locationsRepository.findOne({
                    where: { id: 1 },
                });
                user = await this.usersRepository.save({
                    telegram_id: telegram_id,
                    location: location.id,
                });
                const lastChapter = await this.chaptersRepository.findOne({
                    where: { content: (0, typeorm_1.Like)('Один из грузовиков%') },
                });
                progress = await this.progressRepository.save({
                    user_id: user.id,
                    chapter_id: lastChapter.id,
                    location: location.id,
                });
            }
            if (!(progress === null || progress === void 0 ? void 0 : progress.chat_id) || !(progress === null || progress === void 0 ? void 0 : progress.message_display_id)) {
                const imgLink = this.appService.escapeText('https://clck.ru/33PBvE');
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('Меню', 'menu'),
                ]).reply_markup;
                const messageDisplay = await ctx.replyWithPhoto(imgLink, {
                    caption: 'Display',
                    has_spoiler: true,
                    reply_markup: keyboard,
                });
                await this.progressRepository.update(progress === null || progress === void 0 ? void 0 : progress.progress_id, {
                    chat_id: messageDisplay.chat.id,
                    message_display_id: messageDisplay.message_id,
                });
                progress = await this.progressRepository.findOne({
                    where: { user_id: user === null || user === void 0 ? void 0 : user.id },
                });
            }
            next();
        }
        catch (error) {
            console.error(error);
        }
    }
    async onMenu(ctx) {
        try {
            const telegram_id = this.appService.getTelegramId(ctx);
            const user = await this.usersRepository.findOne({
                where: { telegram_id: telegram_id },
            });
            let progress = await this.progressRepository.findOne({
                where: { user_id: user.id },
            });
            const lastChapter = await this.chaptersRepository.findOne({
                where: { content: (0, typeorm_1.Like)('Один из грузовиков%') },
            });
            const location = await this.locationsRepository.findOne({
                where: { id: 1 },
            });
            if (!progress) {
                progress = await this.progressRepository.save({
                    user_id: user.id,
                    chapter_id: lastChapter.id,
                    location: location.id,
                });
            }
            let chapter = await this.chaptersRepository.findOne({
                where: { id: progress.chapter_id },
            });
            const starterChapter = await this.chaptersRepository.findOne({
                order: { id: 1 },
                where: { content: (0, typeorm_1.Like)('Один из грузовиков%') },
            });
            if (!chapter && starterChapter) {
                chapter = starterChapter;
            }
            const locations = await this.locationsRepository.findOne({
                where: { id: user.location },
            });
            const nextChapter = await this.chaptersRepository.findOne({
                where: { id: progress === null || progress === void 0 ? void 0 : progress.chapter_id, location: locations === null || locations === void 0 ? void 0 : locations.id },
            });
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('📍Перемещение', scenes_enum_1.ScenesEnum.LOCATION),
                telegraf_1.Markup.button.callback('☠️Бандиты', scenes_enum_1.ScenesEnum.BANDIT),
                telegraf_1.Markup.button.callback('📟PDA', 'PDA'),
                telegraf_1.Markup.button.callback('☢️История', scenes_enum_1.ScenesEnum.QUEST, !!!nextChapter),
            ], {
                columns: 1,
            }).reply_markup;
            this.appService.updateDisplay(progress, keyboard, this.appService.escapeText(`Вы на локации: ${locations === null || locations === void 0 ? void 0 : locations.name}.`), locations.image);
        }
        catch (error) {
            console.error(error);
        }
    }
    async enterBanditScene(ctx) {
        await ctx.scene.enter(scenes_enum_1.ScenesEnum.BANDIT);
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
    (0, nestjs_telegraf_1.Action)(scenes_enum_1.ScenesEnum.BANDIT),
    (0, nestjs_telegraf_1.Command)(scenes_enum_1.ScenesEnum.BANDIT),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterBanditScene", null);
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
    __param(1, (0, typeorm_2.InjectRepository)(users_entity_1.UsersEntity)),
    __param(2, (0, typeorm_2.InjectRepository)(chapters_entity_1.ChaptersEntity)),
    __param(3, (0, typeorm_2.InjectRepository)(choices_entity_1.ChoicesEntity)),
    __param(4, (0, typeorm_2.InjectRepository)(progress_entity_1.ProgressEntity)),
    __param(5, (0, typeorm_2.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_2.InjectRepository)(locations_entity_1.LocationsEntity)),
    __param(7, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        telegraf_1.Telegraf])
], AppUpdate);
exports.default = AppUpdate;
//# sourceMappingURL=app.update.js.map