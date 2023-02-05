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
var MutantScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutantScene = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const app_service_1 = require("../app.service");
const chapters_entity_1 = require("../user/entities/chapters.entity");
const choices_entity_1 = require("../user/entities/choices.entity");
const inventory_items_entity_1 = require("../user/entities/inventory_items.entity");
const locations_entity_1 = require("../user/entities/locations.entity");
const mutants_entity_1 = require("../user/entities/mutants.entity");
const progress_entity_1 = require("../user/entities/progress.entity");
const users_entity_1 = require("../user/entities/users.entity");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const activity_enum_1 = require("./enums/activity.enum");
const scenes_enum_1 = require("./enums/scenes.enum");
let MutantScene = MutantScene_1 = class MutantScene {
    constructor(appService, usersRepository, chaptersRepository, choicesRepository, progressRepository, inventoryItemsRepository, mutantsRepository, locationsRepository) {
        this.appService = appService;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.inventoryItemsRepository = inventoryItemsRepository;
        this.mutantsRepository = mutantsRepository;
        this.locationsRepository = locationsRepository;
        this.logger = new common_1.Logger(MutantScene_1.name);
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
                await this.progressRepository.save({
                    user_id: user.id,
                    chapter_id: 90,
                });
            }
        }
        else {
            const location = await this.locationsRepository.findOne({
                where: { name: 'Кордон' },
            });
            const userRegistered = await this.usersRepository.save({
                telegram_id: telegram_id,
                location: location.id,
            });
            const lastChapter = await this.chaptersRepository.findOne({
                order: { id: 1 },
                where: { content: (0, typeorm_2.Like)('Один из грузовиков%') },
            });
            await this.progressRepository.save({
                user_id: userRegistered.id,
                chapter_id: 90,
                location: location.id,
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
        const mutantList = await this.mutantsRepository.find();
        const partList = ['плечо', 'лицо', 'ноги', 'живот', 'грудь', 'руки'];
        const mutant = this.appService.getRandomElInArr(mutantList);
        await ctx.reply(`Вы встретили мутанта: "${mutant.name}". Итоги боя\n` +
            this.battle(mutant, user));
        await ctx.scene.leave();
    }
    battleHitText(damage) {
        const options = [
            'нанес вам урон на ' + damage,
            'нанес урон вашему телу на ' + damage,
            'повредил вас, отобрав ' + damage,
            'нанес увечья на ' + damage,
            'нанес травмы ровно на ' + damage,
            'вы впитали урон, равный ' + damage,
            'покалечил вас ударом на ' + damage,
        ];
        return this.appService.getRandomElInArr(options);
    }
    battle(enemy, user, text = '') {
        const agilityUser = 5;
        const agilityEnemy = 1;
        let dodgeUser = false;
        let dodgeEnemy = false;
        if (agilityUser >= agilityEnemy) {
            dodgeUser =
                Math.random() * ((agilityUser - agilityEnemy) * 10) >
                    Math.random() * 100;
        }
        else {
            dodgeEnemy =
                Math.random() * ((agilityEnemy - agilityUser) * 10) >
                    Math.random() * 100;
        }
        let randomModifier = Math.random() * 0.5 + 0.75;
        let enemyDamage = 0;
        const userDamage = !dodgeEnemy ? Math.floor(250 * randomModifier) : 0;
        for (let i = 0; i < enemy.actions; i++) {
            randomModifier = Math.random() * 0.5 + 0.75;
            dodgeUser =
                Math.random() * ((agilityUser - agilityEnemy) * 10) >
                    Math.random() * 100;
            dodgeEnemy =
                Math.random() * ((agilityEnemy - agilityUser) * 10) >
                    Math.random() * 100;
            enemyDamage = !dodgeUser
                ? Math.floor((enemy.damage * randomModifier) / enemy.actions)
                : 0;
            user.health -= enemyDamage;
            text += `\nХод врага ${i + 1}) ${enemy.name} - ${this.battleHitText(enemyDamage)} HP.${dodgeUser ? '\n🍀 Уклонение.' : ''}\nВаше 🫀: ${user.health <= 0 ? 0 : user.health}\n`;
            if (user.health <= 0) {
                text += '\n☠️ Вы проиграли. Зона забрала вас.';
                return text;
            }
        }
        for (let i = 0; i < 7; i++) {
            enemy.health -= userDamage;
            text += `\nХод ${i + 1}) Вы нанесли ${enemyDamage} урона ▶️ ${enemy.name} ${dodgeEnemy ? '\nВраг уклониося 🍀.' : ''}\nВражеское 🫀: ${enemy.health <= 0 ? 0 : enemy.health}\n`;
            if (enemy.health <= 0) {
                text += `\n${enemy.name} теперь никого не побеспокоит.`;
                return text;
            }
        }
        return this.battle(enemy, user, text);
    }
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
        await ctx.reply('Встреча с мутантом окончена.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('Меню', 'menu')]));
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "onRegister", null);
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('play'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "market", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('mystats'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "mystats", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('mission'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "mission", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(new RegExp(activity_enum_1.ActivityEnum.JOB + '.*', 'gm')),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "job", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "onLeaveCommand", null);
__decorate([
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MutantScene.prototype, "onSceneLeave", null);
MutantScene = MutantScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.MUTANT),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.ChaptersEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.ChoicesEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.ProgressEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_1.InjectRepository)(mutants_entity_1.MutantsEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(locations_entity_1.LocationsEntity)),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MutantScene);
exports.MutantScene = MutantScene;
//# sourceMappingURL=mutant.scene.js.map