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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyRoadScene = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const activity_enum_1 = require("./enums/activity.enum");
const scenes_enum_1 = require("./enums/scenes.enum");
let AnomalyRoadScene = class AnomalyRoadScene {
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
        await ctx.reply('Вы выбрались из аномальной зоны.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('Меню', 'menu')]));
    }
};
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
AnomalyRoadScene = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.SCENE_ANOMALY_ROAD)
], AnomalyRoadScene);
exports.AnomalyRoadScene = AnomalyRoadScene;
//# sourceMappingURL=anomaly.scene.js.map