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
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nestjs_telegraf_1 = require("nestjs-telegraf");
let TelegramService = class TelegramService {
    constructor(bot) {
        this.bot = bot;
    }
    async commandListInit() {
        await this.bot.telegram.setMyCommands([
            { command: 'start', description: 'Get main menu.' },
        ]);
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
            throw new common_1.InternalServerErrorException(error, 'Telegram bot error');
        }
    }
    getRandomElInArr(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    progressGraphics(fullHp, currentHp, typeHave, typeLost) {
        const have = typeHave || '■';
        const lost = typeLost || '□';
        let result = '';
        const value = Math.round((currentHp / fullHp) * 10);
        if ((have === null || have === void 0 ? void 0 : have.length) === 2 && (lost === null || lost === void 0 ? void 0 : lost.length) === 2) {
            if (value <= 0) {
                result += Array.from('0'.repeat(10))
                    .map((item, index) => (index % 2 === 0 ? lost[0] : lost[1]))
                    .join('');
                result += ` ${Math.round((currentHp / fullHp) * 100)}%`;
                return result;
            }
            if (value === 10) {
                result = Array.from('1'.repeat(value))
                    .map((item, index) => (index % 2 === 0 ? have[0] : have[1]))
                    .join('');
                result += ` ${Math.round((currentHp / fullHp) * 100)}%`;
                return result;
            }
            result = Array.from('1'.repeat(value))
                .map((item, index) => (index % 2 === 0 ? have[0] : have[1]))
                .join('');
            result += Array.from('0'.repeat(10 - value))
                .map((item, index) => (index % 2 === 0 ? lost[0] : lost[1]))
                .join('');
            result += ` ${Math.round((currentHp / fullHp) * 100)}%`;
            return result;
        }
        else {
            if (value <= 0) {
                result = lost.repeat(10);
                result += ` ${Math.round((currentHp / fullHp) * 100)}%`;
                return result;
            }
            if (value === 10) {
                result = have.repeat(value);
                result += ` ${Math.round((currentHp / fullHp) * 100)}%`;
                return result;
            }
            result = have.repeat(value) + lost.repeat(10 - value);
            result += ` ${Math.round((currentHp / fullHp) * 100)}%`;
            return result;
        }
        return result;
    }
};
TelegramService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [telegraf_1.Telegraf])
], TelegramService);
exports.TelegramService = TelegramService;
//# sourceMappingURL=telegram.service.js.map