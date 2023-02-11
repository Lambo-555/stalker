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
var PdaScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdaScene = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const telegraf_1 = require("telegraf");
const scenes_enum_1 = require("./enums/scenes.enum");
let PdaScene = PdaScene_1 = class PdaScene {
    constructor(appService) {
        this.appService = appService;
        this.logger = new common_1.Logger(PdaScene_1.name);
    }
    async onSceneEnter(ctx) {
        const playerData = await this.appService.getStorePlayerData(ctx);
        const nextChapter = await this.appService.getGoalChapter(playerData);
        const nextLocation = await this.appService.getLocation(nextChapter.location);
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('Меню', 'menu'),
        ]).reply_markup;
        const pdaMenu = `
📟 Вы смотрите в свой КПК(PDA)

Текущая локация: ${playerData.playerLocation.location}
Целевая локация: ${nextLocation.location}`;
        await this.appService.updateDisplay(playerData.playerProgress, keyboard, pdaMenu, playerData.playerLocation.image);
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
};
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    (0, nestjs_telegraf_1.Command)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onLeaveCommand", null);
PdaScene = PdaScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.SCENE_PDA),
    __metadata("design:paramtypes", [app_service_1.AppService])
], PdaScene);
exports.PdaScene = PdaScene;
//# sourceMappingURL=pda.scene.js.map