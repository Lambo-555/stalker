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
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const telegraf_1 = require("telegraf");
const scenes_enum_1 = require("./enums/scenes.enum");
let QuestScene = QuestScene_1 = class QuestScene {
    constructor(appService) {
        this.appService = appService;
        this.logger = new common_1.Logger(QuestScene_1.name);
    }
    async onSceneEnter(ctx) {
        try {
            const playerData = await this.appService.getStorePlayerData(ctx);
            const chapter = await this.appService.getNextChapter(playerData);
            if (chapter.location === playerData.playerLocation.location) {
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('🤝Диалог', 'chapterXXX' + chapter.code),
                    telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
                ]).reply_markup;
                await this.appService.updateDisplay(playerData.playerProgress, keyboard, `${chapter === null || chapter === void 0 ? void 0 : chapter.character}`, playerData.playerLocation.image);
            }
            else {
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
                ]).reply_markup;
                await this.appService.updateDisplay(playerData.playerProgress, keyboard, `Здесь не с кем взаимодействовать`, playerData.playerLocation.image);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    async onChooseChapter(ctx, next) {
        try {
            const match = ctx.match[0];
            if (!match)
                next();
            const selectedChapterCode = match.split('XXX')[1];
            let playerData = await this.appService.getStorePlayerData(ctx);
            ctx.scene.state[playerData.player.telegram_id] =
                await this.appService.updateStorePlayerProgress(ctx, Object.assign(Object.assign({}, playerData.playerProgress), { chapter_code: selectedChapterCode }));
            playerData = await this.appService.getStorePlayerData(ctx);
            const nextChapter = await this.appService.getNextChapter(playerData);
            if (!nextChapter) {
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
                ]).reply_markup;
                await this.appService.updateDisplay(playerData.playerProgress, keyboard, `Здесь не с кем взаимодействовать`, playerData.playerLocation.image);
            }
            else {
                const choices = await this.appService.getChoiceList(nextChapter.code);
                choices.forEach(async (item) => {
                    const chapter = await this.appService.getChapterByCode(item.next_code);
                    return Object.assign(Object.assign({}, item), { description: chapter.character });
                });
                const keyboard = telegraf_1.Markup.inlineKeyboard([
                    ...choices.map((item) => telegraf_1.Markup.button.callback(this.appService.escapeText(item === null || item === void 0 ? void 0 : item.description), 'chapterXXX' + item.next_code.toString())),
                ], {
                    columns: 1,
                }).reply_markup;
                await this.appService.updateDisplay(playerData.playerProgress, keyboard, `${nextChapter === null || nextChapter === void 0 ? void 0 : nextChapter.character}: ` + nextChapter.content, playerData.playerLocation.image);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        var _a, _b;
        try {
            await ctx.scene.leave();
            const playerData = await this.appService.getStorePlayerData(ctx);
            const chapterNext = await this.appService.getNextChapter(playerData);
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('📍Перемещение', scenes_enum_1.ScenesEnum.SCENE_LOCATION),
                telegraf_1.Markup.button.callback('☠️Бандиты', scenes_enum_1.ScenesEnum.SCENE_BANDIT),
                telegraf_1.Markup.button.callback('📟PDA', scenes_enum_1.ScenesEnum.SCENE_PDA),
                telegraf_1.Markup.button.callback('☢️Взаимодействие', scenes_enum_1.ScenesEnum.SCENE_QUEST, !!!chapterNext),
            ], {
                columns: 1,
            }).reply_markup;
            this.appService.updateDisplay(playerData === null || playerData === void 0 ? void 0 : playerData.playerProgress, keyboard, this.appService.escapeText(`Вы на локации: ${(_a = playerData === null || playerData === void 0 ? void 0 : playerData.playerLocation) === null || _a === void 0 ? void 0 : _a.location}.`), (_b = playerData === null || playerData === void 0 ? void 0 : playerData.playerLocation) === null || _b === void 0 ? void 0 : _b.image);
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
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.SCENE_QUEST),
    __metadata("design:paramtypes", [app_service_1.AppService])
], QuestScene);
exports.QuestScene = QuestScene;
//# sourceMappingURL=quest.scene.js.map