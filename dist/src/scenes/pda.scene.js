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
let PdaScene = PdaScene_1 = class PdaScene {
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
        this.logger = new common_1.Logger(PdaScene_1.name);
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
        const pdaVersion = 'stable';
        const userLocation = await this.locationsRepository.findOne({
            where: { id: user.location },
        });
        await ctx.replyWithHTML(`
📟 Вы смотрите в свой КПК(PDA). Версия прошивки "${pdaVersion}"

Здоровье: ${user.health}🫀, Радиация: ${user.radiation}☢️,
Кровотечение: ${0}🩸, Пси-состояние: ${100}🧠,
Локация: ${userLocation.name},
Средства: ${user.funds}🛢,

📱 /about - О КПК
🎒 /inventory - Рюкзак (wip)
📻 /radioTune - Настройка волны радио (только для версии прошивки <b>PDA-X16</b>)
📍 /location - Текущая локация
🪬 /quest - Текуший квест-задача, её локация

🎟💴 /buyTickets - Купить билеты проводников (wip)
🔑💳 /crypto - Подключение крипто-кошельков (wip)

🕯 /chat - Доступ V чат сталкеров (wip торговля)
🗺 /map - Просмотр пройденного пути на карте Зоны (wip)
🎭 /art - Арты про STALKER (wip)
🆘 /help - Помощь и пояснения
📊 /statistics - Статистика игрока (wip)
💡 /feedback - Написать отзыв об ошибках и предложениях

🚪 /leave - Выход в основное меню
`);
    }
    async onAbout(ctx, next) {
        await ctx.reply(`
КПК, он же PDA - самый распространенный девайс в Зоне. Причин тому несколько:
- другие устройства не работают при воздействии столь мощной радиации и аномалий
- данная модель выпущена огромным тиражем, дешева и часто "передается по наследству"
- более подобных КПК не выпускают, на них стоит запрет, как и на все сталкерское
- мастера меняют лишь версии прошивки, но не создают само железо
- функций КПК хватает, разве что артефакты он не ищет, но это пока что

Без пароля от КПК не достать нужные данные. Удается лишь считать последние открытые вкладки.
Увесистая вышла штука. Но в целом ценная вещь, ее стоит беречь.

📱 /reenter - Меню КПК 
🚪 /leave - Выход в основное меню
      `);
    }
    async onLeaveCommand(ctx) {
        await ctx.scene.leave();
    }
    async onSceneLeave(ctx) {
        await ctx.reply('Вы перестали смотреть на КПК.', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.callback('🍔Меню', 'menu')]));
    }
};
__decorate([
    (0, nestjs_telegraf_1.Use)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onRegister", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('/reenter'),
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('/about'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __param(1, (0, nestjs_telegraf_1.Next)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onAbout", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('leave'),
    (0, nestjs_telegraf_1.Command)('leave'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onLeaveCommand", null);
__decorate([
    (0, nestjs_telegraf_1.SceneLeave)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PdaScene.prototype, "onSceneLeave", null);
PdaScene = PdaScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)(scenes_enum_1.ScenesEnum.PDA),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.Chapters)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.Choices)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_items_entity_1.InventoryItems)),
    __param(6, (0, typeorm_1.InjectRepository)(artifacts_entity_1.Artifacts)),
    __param(7, (0, typeorm_1.InjectRepository)(anomalies_entity_1.Anomalies)),
    __param(8, (0, typeorm_1.InjectRepository)(locations_entity_1.LocationsEntity)),
    __param(9, (0, typeorm_1.InjectRepository)(roads_entity_1.RoadsEntity)),
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
], PdaScene);
exports.PdaScene = PdaScene;
//# sourceMappingURL=pda.scene.js.map