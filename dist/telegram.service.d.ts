import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
export declare class TelegramService {
    private bot;
    constructor(bot: Telegraf<Scenes.SceneContext>);
    commandListInit(): Promise<void>;
    menuSplitter(arr: any, cols: any): any[];
    sendMessageByTelegramId(telegramId: number, message: string, extra?: ExtraReplyMessage): Promise<import("typegram/message").Message.TextMessage>;
    getRandomElInArr(arr: []): never;
    sleep(ms: any): Promise<unknown>;
    progressGraphics(fullHp: number, currentHp: number, typeHave?: string, typeLost?: string): string;
}
