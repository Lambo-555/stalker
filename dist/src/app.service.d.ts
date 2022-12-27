import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
export declare class AppService {
    private bot;
    constructor(bot: Telegraf<Scenes.SceneContext>);
    commandListInit(): Promise<void>;
    sleep(ms: any): Promise<unknown>;
    getRandomElInArr(arr: []): never;
    menuSplitter(arr: any, cols: any): any[];
    sendMessageByTelegramId(telegramId: number, message: string, extra?: ExtraReplyMessage): Promise<import("typegram/message").Message.TextMessage>;
}
