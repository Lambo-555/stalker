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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const crypto_1 = require("crypto");
let AppService = class AppService {
    constructor(bot) {
        this.bot = bot;
        this.algorithm = 'aes-256-ctr';
        this.secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
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
        await this.bot.telegram.setMyCommands([
            { command: 'menu', description: 'Главное меню' },
            { command: 'display', description: 'Создать новый игровой дисплей' },
        ]);
    }
    escapeText(escapedMsg) {
        return escapedMsg;
        return escapedMsg
            .replace(/_/gim, '\\_')
            .replace(/\*\*/gim, '----------')
            .replace(/\*/gim, '\\*')
            .replace(/----------/gim, '*')
            .replace(/\(/gim, '\\(')
            .replace(/\)/gim, '\\)')
            .replace(/\[/gim, '\\[')
            .replace(/\!/gim, '\\!')
            .replace(/\`/gim, '\\`')
            .replace(/\-/gim, '\\-')
            .replace(/\./gim, '\\.')
            .replace(/\,/gim, '\\,');
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
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppService.prototype, "getTelegramId", null);
AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [telegraf_1.Telegraf])
], AppService);
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map