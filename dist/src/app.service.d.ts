import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
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
    sleep(ms: any): Promise<unknown>;
    getRandomElInArr(arr: any[]): any;
    menuSplitter(arr: any, cols: any): any[];
    sendMessageByTelegramId(telegramId: number, message: string, extra?: ExtraReplyMessage): Promise<import("typegram/message").Message.TextMessage>;
}
