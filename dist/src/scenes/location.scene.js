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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var LocationScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationScene = void 0;
const common_1 = require("@nestjs/common");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const telegraf_1 = require("telegraf");
const scenes_enum_1 = require("./enums/scenes.enum");
let LocationScene = LocationScene_1 = class LocationScene {
    constructor(bot, appService) {
        this.bot = bot;
        this.appService = appService;
        this.logger = new common_1.Logger(LocationScene_1.name);
    }
    async onSceneEnter(ctx) {
        var e_1, _a;
        const playerData = await this.appService.getStorePlayerData(ctx);
        const roads = await this.appService.getRoadList(playerData.playerLocation.location);
        const nextLocations = [];
        try {
            for (var roads_1 = __asyncValues(roads), roads_1_1; roads_1_1 = await roads_1.next(), !roads_1_1.done;) {
                const road = roads_1_1.value;
                const locationsItem = await this.appService.getLocation(road.to);
                nextLocations.push(locationsItem);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (roads_1_1 && !roads_1_1.done && (_a = roads_1.return)) await _a.call(roads_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            ...nextLocations.map((locationItem) => telegraf_1.Markup.button.callback(locationItem === null || locationItem === void 0 ? void 0 : locationItem.location, 'locationsXXX' + locationItem.location.toString())),
            telegraf_1.Markup.button.callback('📍Остаться здесь', 'leave'),
        ], {
            columns: 1,
        }).reply_markup;
        await this.appService.updateDisplay(playerData.player, null, `🏃 Перемещение...`, 'https://sun9-23.userapi.com/impg/BerBvhk0PaC29WoXTFWTf49Fa-G_ktt1OXe7Ng/53JM42xkeeo.jpg?size=1920x855&quality=95&sign=1bc2fed9648961b2d332a7c6d42c8555&type=album');
        await this.appService.sleep(Math.random() * 1500);
        await this.appService.updateDisplay(playerData.player, keyboard, `Вы находитесь в локации: "${playerData.playerLocation.location}". Куда вы хотите отправиться?`, playerData.playerLocation.image);
    }
    async onChox(ctx, next) {
        ctx.reply('awdaw');
    }
    async onChoose(ctx, next) {
        const match = ctx.match[0];
        if (!match)
            next();
        const locationCode = match.split('XXX')[1];
        const playerData = await this.appService.getStorePlayerData(ctx);
        const location = await this.appService.getLocation(locationCode);
        await ctx.answerCbQuery(`В дороге вам стало легче, ${playerData.player.will} + 10 воли.`, {
            show_alert: false,
            cache_time: 500,
        });
        playerData.player.will += 10;
        ctx.scene.state[playerData.player.telegram_id] =
            await this.appService.updateStorePlayerLocation(ctx, Object.assign(Object.assign({}, playerData.player), { location: location.location }));
        const nextChapter = await this.appService.getChapterByCode(playerData.playerProgress.chapter_code);
        const isBattle = this.chooseBattleByLocation(ctx, location.location, nextChapter);
        if (isBattle)
            return isBattle;
        ctx.scene.reenter();
    }
    chooseBattleByLocation(ctx, location, nextChapter) {
        if (location.includes('(бандиты)') &&
            (nextChapter === null || nextChapter === void 0 ? void 0 : nextChapter.character) === 'Бандиты (враги)') {
            return ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_BATTLE);
        }
        if (location.includes('(бандиты)')) {
            return ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_BATTLE);
        }
        if (location.includes('(армия)')) {
            return ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_BATTLE);
        }
        if (location.includes('(монолит)')) {
            return ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_BATTLE);
        }
        if (location.includes('(зомби)')) {
            return ctx.scene.enter(scenes_enum_1.ScenesEnum.SCENE_BATTLE);
        }
    }
    async onLeaveCommand(ctx) {
        var _a, _b;
        await ctx.scene.leave();
        const playerData = await this.appService.getStorePlayerData(ctx);
        const chapterNext = await this.appService.getNextChapter(playerData);
        const keyboard = telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('📍Перемещение', scenes_enum_1.ScenesEnum.SCENE_LOCATION),
            telegraf_1.Markup.button.callback('📟PDA', scenes_enum_1.ScenesEnum.SCENE_PDA),
            telegraf_1.Markup.button.callback('☢️Взаимодействие', scenes_enum_1.ScenesEnum.SCENE_QUEST, !!!chapterNext),
        ], {
            columns: 1,
        }).reply_markup;
        this.appService.updateDisplay(playerData === null || playerData === void 0 ? void 0 : playerData.player, keyboard, this.appService.escapeText(`Вы на локации: ${(_a = playerData === null || playerData === void 0 ? void 0 : playerData.playerLocation) === null || _a === void 0 ? void 0 : _a.location}.`), (_b = playerData === null || playerData === void 0 ? void 0 : playerData.playerLocation) === null || _b === void 0 ? void 0 : _b.image);
    }
};
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('alert'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onChox", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/locationsXXX.*/gim),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onChoose", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onLeaveCommand", null);
LocationScene = LocationScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.SCENE_LOCATION),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [telegraf_1.Telegraf,
        app_service_1.AppService])
], LocationScene);
exports.LocationScene = LocationScene;
//# sourceMappingURL=location.scene.js.map