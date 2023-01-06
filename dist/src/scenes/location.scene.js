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
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const anomalies_entity_1 = require("../user/entities/anomalies.entity");
const artifacts_entity_1 = require("../user/entities/artifacts.entity");
const chapters_entity_1 = require("../user/entities/chapters.entity");
const choices_entity_1 = require("../user/entities/choices.entity");
const inventory_items_entity_1 = require("../user/entities/inventory_items.entity");
const maps_entity_1 = require("../user/entities/maps.entity");
const progress_entity_1 = require("../user/entities/progress.entity");
const roads_entity_1 = require("../user/entities/roads.entity");
const users_entity_1 = require("../user/entities/users.entity");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const scenes_enum_1 = require("./enums/scenes.enum");
let LocationScene = LocationScene_1 = class LocationScene {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, artifactsRepository, anomaliesRepository, mapsRepository, roadsRepository) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.artifactsRepository = artifactsRepository;
        this.anomaliesRepository = anomaliesRepository;
        this.mapsRepository = mapsRepository;
        this.roadsRepository = roadsRepository;
        this.logger = new common_1.Logger(LocationScene_1.name);
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
        var _a, e_1, _b, _c;
        var _d, _e, _f;
        const telegram_id = ((_d = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _d === void 0 ? void 0 : _d.from.id) || ((_f = (_e = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _e === void 0 ? void 0 : _e.from) === null || _f === void 0 ? void 0 : _f.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        const maps = await this.mapsRepository.findOne({
            where: { id: user.location },
        });
        const roads = await this.roadsRepository.find({
            where: { from: user.location },
        });
        const nextMaps = [];
        try {
            for (var _g = true, roads_1 = __asyncValues(roads), roads_1_1; roads_1_1 = await roads_1.next(), _a = roads_1_1.done, !_a;) {
                _c = roads_1_1.value;
                _g = false;
                try {
                    const road = _c;
                    const mapsItem = await this.mapsRepository.findOne({
                        where: { id: road.to },
                    });
                    nextMaps.push(mapsItem);
                }
                finally {
                    _g = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = roads_1.return)) await _b.call(roads_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        await ctx.reply(`Вы находитесь в локации: "${maps.name}". Куда вы хотите отправиться?`, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('🍔Меню', 'menu'),
            telegraf_1.Markup.button.callback('📍Остаться здесь', 'leave'),
            ...nextMaps.map((mapsItem) => telegraf_1.Markup.button.callback(mapsItem === null || mapsItem === void 0 ? void 0 : mapsItem.name, 'mapsXXX' + mapsItem.id.toString())),
        ], {
            columns: 1,
        }));
    }
    async onChoose(ctx, next) {
        var _a, _b, _c;
        const match = ctx.match[0];
        if (!match)
            next();
        const mapId = +match.split('XXX')[1];
        const map = await this.mapsRepository.findOne({
            where: { id: mapId },
        });
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        user.location = map.id || mapId;
        await this.usersRepository.update({ id: user.id }, user);
        await ctx.scene.leave();
        await ctx.reply(`Вы вошли в локацию: ${map.name}`, telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('🍔Меню', 'menu')], {
            columns: 1,
        }));
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        await ctx.reply('Перемещение завершено.');
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onRegister", null);
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/mapsXXX.*/gim),
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
__decorate([
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationScene.prototype, "onSceneLeave", null);
LocationScene = LocationScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.LOCATION),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.Chapters)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.Choices)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_1.InjectRepository)(artifacts_entity_1.Artifacts)),
    __param(7, (0, typeorm_1.InjectRepository)(anomalies_entity_1.Anomalies)),
    __param(8, (0, typeorm_1.InjectRepository)(maps_entity_1.Maps)),
    __param(9, (0, typeorm_1.InjectRepository)(roads_entity_1.Roads)),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LocationScene);
exports.LocationScene = LocationScene;
//# sourceMappingURL=location.scene.js.map