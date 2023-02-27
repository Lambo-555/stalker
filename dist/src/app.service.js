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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const crypto_1 = require("crypto");
const progress_entity_1 = require("./user/entities/progress.entity");
const typeorm_1 = require("@nestjs/typeorm");
const users_entity_1 = require("./user/entities/users.entity");
const chapters_entity_1 = require("./user/entities/chapters.entity");
const choices_entity_1 = require("./user/entities/choices.entity");
const locations_entity_1 = require("./user/entities/locations.entity");
const typeorm_2 = require("typeorm");
const roads_entity_1 = require("./user/entities/roads.entity");
let AppService = class AppService {
    constructor(bot, usersRepository, chaptersRepository, choicesRepository, progressRepository, roadsRepository, locationsRepository) {
        this.bot = bot;
        this.usersRepository = usersRepository;
        this.chaptersRepository = chaptersRepository;
        this.choicesRepository = choicesRepository;
        this.progressRepository = progressRepository;
        this.roadsRepository = roadsRepository;
        this.locationsRepository = locationsRepository;
        this.algorithm = 'aes-256-ctr';
        this.secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
        this.commandList = [
            { command: 'menu', description: 'Главное меню' },
            { command: 'display', description: 'Создать новый игровой дисплей' },
        ];
    }
    encrypt(text) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex'),
        };
    }
    async updateStorePlayerLocation(ctx, playerLocation) {
        const telegram_id = this.getTelegramId(ctx);
        const { id } = playerLocation, dataToUpdate = __rest(playerLocation, ["id"]);
        await this.usersRepository.update(id, dataToUpdate);
        ctx.scene.state[telegram_id] = Object.assign(Object.assign({}, ctx.scene.state[telegram_id]), { playerLocation });
        console.log('player update location. telegram_id: ', telegram_id);
        return ctx.scene.state[telegram_id];
    }
    async updateStorePlayerProgress(ctx, playerProgress) {
        const telegram_id = this.getTelegramId(ctx);
        const { progress_id } = playerProgress, dataToUpdate = __rest(playerProgress, ["progress_id"]);
        await this.progressRepository.update(progress_id, dataToUpdate);
        ctx.scene.state[telegram_id] = Object.assign(Object.assign({}, ctx.scene.state[telegram_id]), { playerProgress });
        console.log('player update progress. telegram_id: ', telegram_id);
        return ctx.scene.state[telegram_id];
    }
    async connectPlayerMonitor() { }
    async getLocation(location) {
        const locationData = await this.locationsRepository.findOne({
            where: { location: location },
        });
        return locationData;
    }
    async getChapterByCode(code) {
        const chapterData = await this.chaptersRepository.findOne({
            where: { code: code },
        });
        return chapterData;
    }
    async getRoadList(location) {
        const roadList = await this.roadsRepository.find({
            where: { from: location },
        });
        return roadList;
    }
    async getChoiceList(code) {
        const choices = await this.choicesRepository.find({
            where: { code: code },
        });
        return choices;
    }
    async getStorePlayerData(ctx) {
        var _a;
        const telegram_id = this.getTelegramId(ctx);
        if (!((_a = ctx.scene) === null || _a === void 0 ? void 0 : _a.state[telegram_id])) {
            let player = await this.usersRepository.findOne({
                where: { telegram_id: telegram_id },
            });
            if (!player) {
                player = (await this.registerNewPlayer(ctx)).player;
            }
            const playerLocation = await this.locationsRepository.findOne({
                where: { location: player === null || player === void 0 ? void 0 : player.location },
            });
            const playerProgress = await this.progressRepository.findOne({
                where: { user_id: player === null || player === void 0 ? void 0 : player.id },
            });
            const playerData = {
                player,
                playerLocation,
                playerProgress,
            };
            ctx.scene.state[telegram_id] = playerData;
            console.log('store initiated for telegram_id: ', telegram_id);
        }
        return ctx.scene.state[telegram_id];
    }
    async getNextChapter(playerData) {
        const chapterNext = await this.chaptersRepository.findOne({
            where: {
                location: playerData.playerLocation.location,
                code: playerData.playerProgress.chapter_code,
            },
        });
        return chapterNext;
    }
    async getGoalChapter(playerData) {
        const chapterNext = await this.chaptersRepository.findOne({
            where: {
                code: playerData.playerProgress.chapter_code,
            },
        });
        return chapterNext;
    }
    async getCurrentChapter(playerData) {
        const currentChapter = await this.chaptersRepository.findOne({
            where: {
                code: playerData.playerProgress.chapter_code,
            },
        });
        return currentChapter;
    }
    async clearMenuCommands(messageText, chatId, messageId) {
        const commandList = this.commandList.map((item) => item.command);
        if (commandList.includes(messageText.slice(1, messageText.length)) &&
            chatId &&
            messageId) {
            await this.bot.telegram.deleteMessage(chatId, messageId);
        }
    }
    async registerNewPlayer(ctx) {
        try {
            const telegram_id = this.getTelegramId(ctx);
            const playerLocation = await this.locationsRepository.findOne({
                where: { location: 'Кордон - Бункер Сидоровича' },
            });
            const player = await this.usersRepository.save({
                telegram_id: telegram_id,
                location: playerLocation.location,
            });
            const startChapter = await this.chaptersRepository.findOne({
                where: { content: (0, typeorm_2.Like)('Один из грузовиков%') },
            });
            const playerProgress = await this.progressRepository.save({
                user_id: player.id,
                chapter_code: startChapter.code,
                location: playerLocation.location,
            });
            const playerData = {
                player,
                playerLocation,
                playerProgress,
            };
            ctx.scene.state[telegram_id] = playerData;
            console.log('Player registered. Telegram_id: ', telegram_id);
            await ctx.reply(`Вы зарегистрированы в новелле. Используйте команду /display для создания меню игры.
  Дисплей и его команды:

  - Двигайтесь по сюжету через меню "Взаимодействие". Оно доступно в определенных локациях.

  - Меняйте локации с помощью меню "Перемещение".

  - Команда "PDA" подскажет где вы находитесь и куда вам нужно отправиться.

  Остальные команды находятся в разработке, такие как "Бандиты".

  Наш чат в телеграмме https://t.me/stalker_novella
  Наша группа в ВК: https://vk.com/stalker_novella
  `);
            return playerData;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    decrypt(hash) {
        try {
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(hash.iv, 'hex'));
            const decrpyted = Buffer.concat([
                decipher.update(Buffer.from(hash.content, 'hex')),
                decipher.final(),
            ]);
            return decrpyted.toString();
        }
        catch (error) {
            console.error(error);
        }
    }
    async commandListInit() {
        await this.bot.telegram.setMyCommands(this.commandList);
    }
    escapeText(escapedMsg) {
        return escapedMsg;
        const specialChars = /[.*+?^${}()|[\]\\]/g;
        const replacements = {
            _: '\\_',
            '**': '----------',
            '*': '\\*',
            '-': '\\-',
            '`': '\\`',
            '(': '\\(',
            ')': '\\)',
            '[': '\\[',
            '!': '\\!',
            '.': '\\.',
            ',': '\\,',
        };
        return escapedMsg.replace(specialChars, (match) => replacements[match] || match);
    }
    async updateDisplay(progress, keyboard, caption, photoLink) {
        try {
            await this.bot.telegram.editMessageMedia(progress.chat_id, progress.message_display_id, null, {
                type: 'photo',
                media: this.escapeText(photoLink) ||
                    this.escapeText('https://media2.giphy.com/media/z6UjsCa1Pq4QoMtkNR/giphy.gif?cid=790b76115ebeebe0c7ac50b73f0eb536c3f7dcaf33451941&rid=giphy.gif&ct=g'),
                caption: this.escapeText(caption) || 'подпись медиа',
            });
            await this.bot.telegram.editMessageReplyMarkup(progress.chat_id, progress.message_display_id, null, keyboard);
        }
        catch (error) {
            console.error(error);
        }
    }
    getTelegramId(ctx) {
        var _a, _b, _c;
        const telegram_id = ((_a = ctx === null || ctx === void 0 ? void 0 : ctx.message) === null || _a === void 0 ? void 0 : _a.from.id) || ((_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.from) === null || _c === void 0 ? void 0 : _c.id);
        return telegram_id;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    getRandomElInArr(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    menuSplitter(arr, cols) {
        if (!arr)
            return [];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            let arr2 = [];
            for (let j = 0; j < cols; j++) {
                if (arr[j + i])
                    arr2.push(arr[j + i]);
            }
            i++;
            result.push(arr2);
            arr2 = [];
        }
        return result;
    }
    sendMessageByTelegramId(telegramId, message, extra) {
        try {
            return this.bot.telegram.sendMessage(telegramId, message, extra && extra);
        }
        catch (error) {
            console.error(error);
        }
    }
};
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, users_entity_1.UsersEntity]),
    __metadata("design:returntype", Promise)
], AppService.prototype, "updateStorePlayerLocation", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, progress_entity_1.ProgressEntity]),
    __metadata("design:returntype", Promise)
], AppService.prototype, "updateStorePlayerProgress", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppService.prototype, "getStorePlayerData", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppService.prototype, "registerNewPlayer", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppService.prototype, "getTelegramId", null);
AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(chapters_entity_1.ChaptersEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(choices_entity_1.ChoicesEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.ProgressEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(roads_entity_1.RoadsEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(locations_entity_1.LocationsEntity)),
    __metadata("design:paramtypes", [telegraf_1.Telegraf,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AppService);
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map