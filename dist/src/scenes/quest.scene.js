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
var QuestScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestScene = void 0;
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
let QuestScene = QuestScene_1 = class QuestScene {
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
        this.logger = new common_1.Logger(QuestScene_1.name);
    }
    async onSceneEnter(ctx) {
        var _a, _b, _c;
        try {
            const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
            const user = await this.usersRepository.findOne({
                where: { telegram_id: telegram_id },
            });
            const location = await this.locationsRepository.findOne({
                where: {
                    location: user.location,
                },
            });
            let progress = await this.progressRepository.findOne({
                where: {
                    user_id: user.id,
                },
            });
            const chapter = await this.chaptersRepository.findOne({
                where: {
                    code: progress.chapter_code,
                },
            });
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
            if (chapter.location === location.location) {
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('🤝Диалог', 'chapterXXX' + chapter.code),
                    telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
                ]).reply_markup;
                await this.appService.updateDisplay(progress, keyboard, `${chapter === null || chapter === void 0 ? void 0 : chapter.character}: ` + chapter.content, location.image);
            }
            else {
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
                ]).reply_markup;
                await this.appService.updateDisplay(progress, keyboard, `Здесь не с кем взаимодействовать`);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    async onChooseChapter(ctx, next) {
        var _a, _b, _c;
        try {
            const match = ctx.match[0];
            if (!match)
                next();
            const selectedChapterCode = match.split('XXX')[1];
            const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
            const user = await this.usersRepository.findOne({
                where: { telegram_id: telegram_id },
            });
            let progress = await this.progressRepository.findOne({
                where: {
                    user_id: user.id,
                },
            });
            const location = await this.locationsRepository.findOne({
                where: {
                    location: user.location,
                },
            });
            await this.progressRepository.update(progress.progress_id, {
                chapter_code: selectedChapterCode,
            });
            progress = await this.progressRepository.findOne({
                where: {
                    user_id: user.id,
                },
            });
            const nextChapter = await this.chaptersRepository.findOne({
                where: { code: progress.chapter_code, location: location.location },
            });
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
            if (!nextChapter) {
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
                ]).reply_markup;
                await this.appService.updateDisplay(progress, keyboard, `Здесь не с кем взаимодействовать`);
            }
            else {
                const choises = await this.choicesRepository.find({
                    where: { code: nextChapter.code },
                });
                choises.forEach(async (item) => {
                    const chapter = await this.chaptersRepository.findOne({
                        where: { code: item.next_code },
                    });
                    return Object.assign(Object.assign({}, item), { description: chapter.character });
                });
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    ...choises.map((item) => telegraf_1.Markup.button.callback(this.appService.escapeText(item === null || item === void 0 ? void 0 : item.description), 'chapterXXX' + item.next_code.toString())),
                ], {
                    columns: 1,
                }).reply_markup;
                await this.appService.updateDisplay(progress, keyboard, `${nextChapter === null || nextChapter === void 0 ? void 0 : nextChapter.character}: ` + nextChapter.content, (nextChapter === null || nextChapter === void 0 ? void 0 : nextChapter.image) || (location === null || location === void 0 ? void 0 : location.image));
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    async onBack(ctx) {
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
        const choiceBack = await this.choicesRepository.findOne({
            where: {
                next_code: progress.chapter_code,
            },
        });
        await this.progressRepository.update(progress, {
            chapter_code: choiceBack.code,
        });
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        var _a, _b, _c;
        try {
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
                telegraf_1.Markup.button.callback('Меню', 'menu'),
            ]).reply_markup;
            const location = await this.locationsRepository.findOne({
                where: { location: user.location },
            });
            await this.appService.updateDisplay(progress, keyboard, `Диалог завершен...`, location === null || location === void 0 ? void 0 : location.image);
        }
        catch (error) {
            console.error(error);
        }
    }
};
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/chapterXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], QuestScene.prototype, "onChooseChapter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('back'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestScene.prototype, "onBack", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestScene.prototype, "onLeaveCommand", null);
__decorate([
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestScene.prototype, "onSceneLeave", null);
QuestScene = QuestScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.QUEST),
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
], QuestScene);
exports.QuestScene = QuestScene;
//# sourceMappingURL=quest.scene.js.map