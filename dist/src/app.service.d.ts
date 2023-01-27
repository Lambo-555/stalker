import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { TelegrafContext } from './interfaces/telegraf-context.interface';
import { ProgressEntity } from './user/entities/progress.entity';
export declare class AppService {
    private bot;
    private readonly algorithm;
    private readonly secretKey;
    constructor(bot: Telegraf<Scenes.SceneContext>);
    encrypt(text: any): {
        iv: string;
        content: string;
    };
    decrypt(hash: any): string;
    commandListInit(): Promise<void>;
    escapeText(escapedMsg: string): string;
    updateDisplay(progress: ProgressEntity, keyboard: InlineKeyboardMarkup, text?: string, mediaLink?: string, mediaText?: string): Promise<void>;
    getTelegramId(ctx: TelegrafContext): number;
    sleep(ms: any): Promise<unknown>;
    getRandomElInArr(arr: any[]): any;
    menuSplitter(arr: any, cols: any): any[];
    sendMessageByTelegramId(telegramId: number, message: string, extra?: ExtraReplyMessage): Promise<import("typegram/message").Message.TextMessage>;
}
