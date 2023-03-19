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
        var _a;
        const playerData = await this.appService.getStorePlayerData(ctx);
        const nextChapter = await this.appService.getGoalChapter(playerData);
        const nextLocation = await this.appService.getLocation(nextChapter.location);
        const guns = await this.appService.getGunList();
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            ...guns.map((gun) => telegraf_1.Markup.button.callback(gun.name, 'gunXXX' + gun.name)),
            telegraf_1.Markup.button.callback('📟Меню', 'menu'),
        ], {
            columns: 2,
        }).reply_markup;
        const pdaMenu = `
📟 Вы смотрите в свой КПК(PDA)

Воля: ${(_a = playerData === null || playerData === void 0 ? void 0 : playerData.player) === null || _a === void 0 ? void 0 : _a.will}

Текущая локация: ${playerData.playerLocation.location}
Целевая локация: ${nextLocation.location}`;
        await this.appService.updateDisplay(playerData.player, keyboard, pdaMenu, playerData.playerLocation.image);
    }
    handleCallbackQuery(ctx) {
        ctx.answerCbQuery('Response message', {
            show_alert: true,
            cache_time: 500,
        });
    }
    async onChooseGun(ctx, next) {
        const match = ctx.match[0];
        if (!match)
            next();
        const selectedGunName = match.split('XXX')[1];
        const playerData = await this.appService.getStorePlayerData(ctx);
        const currentGun = await this.appService.getGunByName(selectedGunName);
        if (currentGun) {
            playerData.player.gun = selectedGunName;
            await this.appService.updateStorePlayer(ctx, playerData.player);
            ctx.answerCbQuery(`Теперь вы носите ${currentGun.name}, оптимальная дистанция ${currentGun.optimal_distance}m`, {
                show_alert: true,
                cache_time: 500,
            });
        }
        else {
            ctx.answerCbQuery(`${selectedGunName} недоступно`, {
                show_alert: false,
                cache_time: 500,
            });
        }
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
    (0, nestjs_telegraf_1.Action)('my_callback_query'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PdaScene.prototype, "handleCallbackQuery", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/gunXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onChooseGun", null);
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