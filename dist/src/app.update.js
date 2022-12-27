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
let AppUpdate = AppUpdate_1 = class AppUpdate {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.logger = new common_1.Logger(AppUpdate_1.name);
    }
    onApplicationBootstrap() {
        this.appService.commandListInit();
    }
    async getCurrentChapter(userId) {
        const progress = await this.progressRepository.findOne({
            where: { user_id: userId },
        });
        if (!progress) {
            return this.chaptersRepository.findOne({ where: { id: 1 } });
        }
        return this.chaptersRepository.findOne({
            where: { id: progress === null || progress === void 0 ? void 0 : progress.chapter_id },
        });
    }
    async getChoices(telegram_id) {
        const currentChapter = await this.getCurrentChapter(telegram_id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        const inventory = new Set(user.inventory.split(','));
        const choices = await this.choicesRepository.find({
            where: { chapter_id: currentChapter === null || currentChapter === void 0 ? void 0 : currentChapter.id },
        });
        return choices.filter((choice) => {
            const choiceInventory = new Set(choice.inventory_required.split(','));
            return [...inventory].every((item) => choiceInventory.has(item));
        });
    }
    async makeChoice(userId, choiceId) {
        const choice = await this.choicesRepository.findOne({
            where: { id: choiceId },
        });
        await this.progressRepository.update({ user_id: userId }, { chapter_id: choice.next_chapter_id });
        return this.chaptersRepository.findOne({
            where: { id: choice === null || choice === void 0 ? void 0 : choice.next_chapter_id },
        });
    }
    async buyItem(telegram_id, itemId) {
        const item = await this.inventoryItemsRepository.findOne({
            where: { id: itemId },
        });
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        if (user.funds < (item === null || item === void 0 ? void 0 : item.price)) {
        }
        user.inventory = `${user === null || user === void 0 ? void 0 : user.inventory},${item === null || item === void 0 ? void 0 : item.name}`;
        user.funds -= (item === null || item === void 0 ? void 0 : item.price) || 0;
        await this.usersRepository.save(user);
    }
    async onRegister(ctx, next) {
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        if (user) {
        }
        else {
            const userRegistered = await this.usersRepository.save({
                telegram_id: telegram_id,
            });
            this.logger.debug(JSON.stringify(userRegistered, null, 2));
        }
        next();
    }
    async onMenu(ctx) {
        const helloText = 'МЕНЮ!'
            ? 'Для вас открыты дополнительные меню'
            : 'Зарегистируйтесь, чтобы получить все возможности бота /registration';
        await ctx.reply(helloText, telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.callback('🎲 Крутить!', 'game'),
            telegraf_1.Markup.button.callback('💰 Пополнить!', 'bank'),
            telegraf_1.Markup.button.callback('🔼 Ставка + 50', 'setbetup'),
            telegraf_1.Markup.button.callback('🔽 Ставка - 50', 'setbetdown'),
            telegraf_1.Markup.button.callback('Регистрация', 'registration'),
        ], {
            columns: 2,
        }));
    }
    async onChapter(ctx) {
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        const user = await this.usersRepository.findOne({
            where: { telegram_id: telegram_id },
        });
        if (!user) {
            ctx.reply('WHAAAT!');
        }
        else {
            const chapter = await this.getCurrentChapter(user.telegram_id);
            const choises = await this.choicesRepository.find({
                where: { chapter_id: chapter.id },
            });
            await ctx.reply('Choooose', telegraf_1.Markup.inlineKeyboard([
                ...choises.map((item) => {
                    var _a;
                    return telegraf_1.Markup.button.callback(((_a = item.description) === null || _a === void 0 ? void 0 : _a.toString()) || 'hello', 'chapter ' + (item === null || item === void 0 ? void 0 : item.next_chapter_id));
                }),
                telegraf_1.Markup.button.callback('Menu', 'menu'),
            ], {
                columns: 2,
            }));
        }
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
    (0, nestjs_telegraf_1.Action)('menu'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "onMenu", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('chapter'),
    (0, nestjs_telegraf_1.Action)('chapter'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUpdate.prototype, "onChapter", null);
AppUpdate = AppUpdate_1 = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(users_entity_1.Users)),
    __param(2, (0, typeorm_2.InjectRepository)(chapters_entity_1.Chapters)),
    __param(3, (0, typeorm_2.InjectRepository)(choices_entity_1.Choices)),
    __param(4, (0, typeorm_2.InjectRepository)(progress_entity_1.Progress)),
    __param(5, (0, typeorm_2.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], AppUpdate);
exports.default = AppUpdate;
//# sourceMappingURL=app.update.js.map