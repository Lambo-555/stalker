import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { BotCommand } from 'telegraf/typings/core/types/typegram';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class TelegramService {
  // получаем экземпляр бота
  constructor(@InjectBot() private bot: Telegraf<Scenes.SceneContext>) {}

  async commandListInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Get main menu.' },
      // { command: 'game', description: 'Start Cobalt game. Play2Earn.' },
      // { command: 'gambling', description: 'Get list of reached gambling machines. Play slots and other games. You can find more in Cobalt game series' },
      // { command: 'registration', description: 'Send your Ethereum wallet data for user gambling games authomats.' },
    ]);
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

  // будем отправлять сообщение пользователю по его id
  sendMessageByTelegramId(
    telegramId: number,
    message: string,
    extra?: ExtraReplyMessage,
  ) {
    try {
      return this.bot.telegram.sendMessage(telegramId, message, extra && extra);
      // готово, сообщение уйдет пользователю при вызове sendMessageByTelegramId
    } catch (error) {
      throw new InternalServerErrorException(error, 'Telegram bot error');
    }
  }

  getRandomElInArr(arr: []) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  progressGraphics(
    fullHp: number,
    currentHp: number,
    typeHave?: string,
    typeLost?: string,
  ) {
    // const robot = '▲▼△▽';
    // const human = '■□';
    // const human = '🌳🪵';
    // const turrel = '◆◇';
    // const animal = '●◌';
    // const tool = '🗡🪝🏹🪓🛡⛓🧰🔨🗜⚔🔗🪛🔩🔧♠♣♥♦🤖🦾🦿🪴🫀🌑🌕☁️☀️🥄🥄🥄🎮🚧⛽️🛸💿💾⚔️🔪🔑🗝📍🔓🔒💔❤️❤️‍🩹➕➖🕶👓';
    // night, status emoji
    const have = typeHave || '■';
    const lost = typeLost || '□';
    let result = '';
    const value = Math.round((currentHp / fullHp) * 10);
    if (have?.length === 2 && lost?.length === 2) {
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
    } else {
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
}
