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
const app_service_1 = require("./app.service");
const scenes_enum_1 = require("./scenes/enums/scenes.enum");
let AppUpdate = AppUpdate_1 = class AppUpdate {
    constructor(appService) {
        this.appService = appService;
        this.logger = new common_1.Logger(AppUpdate_1.name);
    }
    onApplicationBootstrap() {
        this.appService.commandListInit();
    }
    async onUse(ctx, next) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const messageId = (_b = (_a = ctx === null || ctx === void 0 ? void 0 : ctx.update) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message_id;
            const chatId = (_d = (_c = ctx === null || ctx === void 0 ? void 0 : ctx.update) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.chat.id;
            const menuMessage = (_f = (_e = ctx === null || ctx === void 0 ? void 0 : ctx.update) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.text;
            if (menuMessage) {
                await this.appService.clearMenuCommands(menuMessage, chatId, messageId);
            }
            await this.appService.getStorePlayerData(ctx);
            next();
        }
        catch (error) {
            console.error(error);
        }
    }
    async onDisplay(ctx) {
        try {
            const playerData = await this.appService.getStorePlayerData(ctx);
            const imgLink = this.appService.escapeText('https://clck.ru/33PBvE');
            const keyboard = telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Начало', 'menu'),
            ]).reply_markup;
            const messageDisplay = await ctx.replyWithPhoto(imgLink, {
                caption: 'display',
                has_spoiler: true,
                reply_markup: keyboard,
            });
            ctx.scene.state[playerData.player.telegram_id] =
                await this.appService.updateStorePlayerProgress(ctx, Object.assign(Object.assign({}, playerData.playerProgress), { chat_id: messageDisplay.chat.id, message_display_id: messageDisplay.message_id }));
        }
        catch (error) {
            await ctx.reply('Ошибка создания монитора');
            console.log('cant create monitor');
            console.error(error);
        }
    }
    async onMenu(ctx) {
        var _a, _b;
        try {
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
    async enterBanditScene(ctx) {
        const match = ctx.match[0];
        console.log(match);
        if (match) {
            const scene = match;
            await ctx.scene.enter(scene);
        }
        return;
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "onUse", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('/display'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "onDisplay", null);
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
    (0, nestjs_telegraf_1.Action)(/^scene.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "enterBanditScene", null);
AppUpdate = AppUpdate_1 = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppUpdate);
exports.default = AppUpdate;
//# sourceMappingURL=app.update.js.map