import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { BotCommand, InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import crypto from 'crypto';
import { TelegrafContext } from './interfaces/telegraf-context.interface';
import { ProgressEntity } from './user/entities/progress.entity';

@Injectable()
export class AppService {
  private readonly algorithm = 'aes-256-ctr';
  private readonly secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
  constructor(@InjectBot() private bot: Telegraf<Scenes.SceneContext>) { }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
    };
  }

  decrypt(hash) {
    try {
      console.log('hashhashhashhash', hash);
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        Buffer.from(hash.iv, 'hex'),
      );
      console.log('decipherdecipher', decipher);
      const decrpyted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, 'hex')),
        decipher.final(),
      ]);
      return decrpyted.toString();
    } catch (error) {
      console.error(error);
    }
  }

  async commandListInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'menu', description: 'Главное меню' },
      // { command: 'start', description: 'Главное меню' },
      // { command: 'registration', description: 'Регистрация' },
      // { command: 'game', description: 'Start Cobalt game. Play2Earn.' },
      // { command: 'gambling', description: 'Get list of reached gambling machines. Play slots and other games. You can find more in Cobalt game series' },
      // { command: 'registration', description: 'Send your Ethereum wallet data for user gambling games authomats.' },
    ]);
  }

  escapeText(escapedMsg: string) {
    return escapedMsg
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\*/g, '\\*')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[')
      .replace(/\!/g, '\\!')
      .replace(/\`/g, '\\`')
      .replace(/\-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/\,/g, '\\,');
  }

  async updateDisplay(
    progress: ProgressEntity,
    keyboard: InlineKeyboardMarkup,
    text?: string,
    mediaLink?: string,
    mediaText?: string,
  ) {
    await this.bot.telegram.editMessageText(
      progress.chat_id,
      progress.message_display_id,
      null,
      this.escapeText(text || '...'),
      {
        reply_markup: keyboard,
        parse_mode: 'MarkdownV2',
      },
    );
    if (mediaLink) {
      await this.bot.telegram.editMessageMedia(
        progress.chat_id,
        progress.message_display_id,
        null,
        {
          type: 'photo',
          media: mediaLink,
          caption: mediaText || 'подпись медиа',
        },
      );
    }
  }

  getTelegramId(@Ctx() ctx: TelegrafContext) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    return telegram_id;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRandomElInArr(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  menuSplitter(arr, cols) {
    if (!arr) return [];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      let arr2 = [];
      for (let j = 0; j < cols; j++) {
        if (arr[j + i]) arr2.push(arr[j + i]);
      }
      i++;
      result.push(arr2);
      arr2 = [];
    }
    return result;
  }

  sendMessageByTelegramId(
    telegramId: number,
    message: string,
    extra?: ExtraReplyMessage,
  ) {
    try {
      return this.bot.telegram.sendMessage(telegramId, message, extra && extra);
    } catch (error) {
      console.error(error);
    }
  }
}
