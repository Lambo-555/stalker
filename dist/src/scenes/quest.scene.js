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
const roads_entity_1 = require("../user/entities/roads.entity");
const users_entity_1 = require("../user/entities/users.entity");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const scenes_enum_1 = require("./enums/scenes.enum");
let QuestScene = QuestScene_1 = class QuestScene {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, artifactsRepository, anomaliesRepository, locationsRepository, roadsRepository) {
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
        this.logger = new common_1.Logger(QuestScene_1.name);
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
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        const location = await this.locationsRepository.findOne({
            where: {
                id: user.location,
            },
        });
        const progress = await this.progressRepository.findOne({
            where: {
                user_id: user.id,
            },
        });
        const chapter = await this.chaptersRepository.findOne({
            where: {
                id: progress.chapter_id,
            },
        });
        if (chapter.location === location.id) {
            await ctx.reply(`На этой локации есть с кем поговорить. ${chapter.character} вас ждет.`, telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('🤝Поговорить', 'chapterXXX' + chapter.id),
                telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
            ]));
        }
        else {
            await ctx.reply(`Здесь не с кем поговорить`, telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave')], {
                columns: 1,
            }));
        }
    }
    async onChooseChapter(ctx, next) {
        var _a, _b, _c;
        const match = ctx.match[0];
        if (!match)
            next();
        console.log('match', match);
        const selectedChapterId = +match.split('XXX')[1];
        console.log('choiseId', selectedChapterId);
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        let progress = await this.progressRepository.findOne({
            where: {
                user_id: user.id,
            },
        });
        console.log('progress1', progress);
        const location = await this.locationsRepository.findOne({
            where: {
                id: user.location,
            },
        });
        await this.progressRepository.update(progress.progress_id, {
            chapter_id: selectedChapterId,
        });
        progress = await this.progressRepository.findOne({
            where: {
                user_id: user.id,
            },
        });
        console.log('progress2', progress);
        const nextChapter = await this.chaptersRepository.findOne({
            where: { id: progress.chapter_id, location: location.id },
        });
        console.log('newChapter', nextChapter);
        if (!nextChapter) {
            await ctx.replyWithHTML(`<b>Более не с кем тут разговаривать</b>`, telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave')]));
        }
        else {
            const choises = await this.choicesRepository.find({
                where: { chapter_id: nextChapter.id },
            });
            console.log('choiseschoises', choises);
            choises.forEach(async (item) => {
                const chapter = await this.chaptersRepository.findOne({
                    where: { id: item.chapter_id },
                });
                return Object.assign(Object.assign({}, item), { description: chapter.character });
            });
            await ctx.replyWithHTML(`<b>${nextChapter.character}:</b> ${nextChapter.content}`, telegraf_1.Markup.inlineKeyboard([
                ...choises.map((item) => telegraf_1.Markup.button.callback((item === null || item === void 0 ? void 0 : item.description) || 'neeext', 'chapterXXX' + item.next_chapter_id.toString())),
                telegraf_1.Markup.button.callback('✋🏻Уйти', 'leave'),
            ], {
                columns: 1,
            }));
        }
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        await ctx.reply('Диалог завершен.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('🍔Меню', 'menu')]));
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], QuestScene.prototype, "onRegister", null);
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
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.QUEST),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.Chapters)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.Choices)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_1.InjectRepository)(artifacts_entity_1.Artifacts)),
    __param(7, (0, typeorm_1.InjectRepository)(anomalies_entity_1.Anomalies)),
    __param(8, (0, typeorm_1.InjectRepository)(locations_entity_1.LocationsEntity)),
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
], QuestScene);
exports.QuestScene = QuestScene;
//# sourceMappingURL=quest.scene.js.map