import { GunInterface, NpcObj } from 'src/common/player-data.dto';
import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { Scenes } from 'telegraf';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import crypto from 'crypto';
import { TelegrafContext } from './interfaces/telegraf-context.interface';
import { ProgressEntity } from './user/entities/progress.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './user/entities/users.entity';
import { ChaptersEntity } from './user/entities/chapters.entity';
import { ChoicesEntity } from './user/entities/choices.entity';
import { LocationsEntity } from './user/entities/locations.entity';
import { Like, Repository } from 'typeorm';
import { PlayerDataDto } from './common/player-data.dto';
import { RoadsEntity } from './user/entities/roads.entity';

@Injectable()
export class AppService {
  private readonly algorithm = 'aes-256-ctr';
  private readonly secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
  private readonly commandList = [
    { command: 'menu', description: 'Главное меню' },
    { command: 'display', description: 'Создать новый игровой дисплей' },
    // { command: 'start', description: 'Главное меню' },
    // { command: 'registration', description: 'Регистрация' },
    // { command: 'game', description: 'Start Cobalt game. Play2Earn.' },
    // { command: 'gambling', description: 'Get list of reached gambling machines. Play slots and other games. You can find more in Cobalt game series' },
    // { command: 'registration', description: 'Send your Ethereum wallet data for user gambling games authomats.' },
  ];
  private readonly guns: GunInterface[] = [
    {
      name: 'Дробовик',
      optimalDistance: 20,
      baseDamage: 150,
      magazine: 1,
    },
    {
      name: 'Пистолет',
      optimalDistance: 80,
      baseDamage: 60,
      magazine: 2,
    },
    {
      name: 'Снайпа',
      optimalDistance: 170,
      baseDamage: 120,
      magazine: 1,
    },
  ];
  constructor(
    @InjectBot() private bot: Telegraf<Scenes.SceneContext>,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(ChaptersEntity)
    private readonly chaptersRepository: Repository<ChaptersEntity>,
    @InjectRepository(ChoicesEntity)
    private readonly choicesRepository: Repository<ChoicesEntity>,
    @InjectRepository(ProgressEntity)
    private readonly progressRepository: Repository<ProgressEntity>,
    @InjectRepository(RoadsEntity)
    private readonly roadsRepository: Repository<RoadsEntity>,
    @InjectRepository(LocationsEntity)
    private readonly locationsRepository: Repository<LocationsEntity>,
  ) {}

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
    };
  }

  async updateStorePlayerLocation(
    @Ctx() ctx: TelegrafContext,
    playerLocation: UsersEntity,
  ) {
    const telegram_id = this.getTelegramId(ctx);
    const { id, ...dataToUpdate } = playerLocation;
    await this.usersRepository.update(id, dataToUpdate);
    ctx.scene.state[telegram_id] = {
      ...ctx.scene.state[telegram_id],
      playerLocation,
    };
    console.log('player update location. telegram_id: ', telegram_id);
    return ctx.scene.state[telegram_id];
  }

  async updateStorePlayerProgress(
    @Ctx() ctx: TelegrafContext,
    playerProgress: ProgressEntity,
  ) {
    const telegram_id = this.getTelegramId(ctx);
    const { progress_id, ...dataToUpdate } = playerProgress;
    await this.progressRepository.update(progress_id, dataToUpdate);
    ctx.scene.state[telegram_id] = {
      ...ctx.scene.state[telegram_id],
      playerProgress,
    };
    console.log('player update progress. telegram_id: ', telegram_id);
    return ctx.scene.state[telegram_id];
  }

  async connectPlayerMonitor() {}

  async getLocation(location: string): Promise<LocationsEntity> {
    const locationData: LocationsEntity =
      await this.locationsRepository.findOne({
        where: { location: location },
      });
    return locationData;
  }

  async getChapterByCode(code: string): Promise<ChaptersEntity> {
    const chapterData: ChaptersEntity = await this.chaptersRepository.findOne({
      where: { code: code },
    });
    return chapterData;
  }

  async getRoadList(location: string): Promise<RoadsEntity[]> {
    const roadList: RoadsEntity[] = await this.roadsRepository.find({
      where: { from: location },
    });
    return roadList;
  }

  async getChoiceList(code: string): Promise<ChoicesEntity[]> {
    const choices: ChoicesEntity[] = await this.choicesRepository.find({
      where: { code: code },
    });
    return choices;
  }

  async getBattleEnemyList(@Ctx() ctx: TelegrafContext): Promise<NpcObj[]> {
    const playerData = await this.getStorePlayerData(ctx);
    return ctx.scene.state[playerData.player.telegram_id]?.battle?.enemyList;
  }

  async updateBattleEnemyList(
    @Ctx() ctx: TelegrafContext,
    newEnemyList,
  ): Promise<NpcObj[]> {
    const playerData = await this.getStorePlayerData(ctx);
    if (ctx.scene.state[playerData.player.telegram_id]?.battle?.enemyList) {
      ctx.scene.state[playerData.player.telegram_id].battle.enemyList =
        newEnemyList;
    }
    return ctx.scene.state[playerData.player.telegram_id].battle.enemyList;
  }

  async getBattlePlayer(@Ctx() ctx: TelegrafContext): Promise<NpcObj> {
    const playerData = await this.getStorePlayerData(ctx);
    return ctx.scene.state[playerData.player.telegram_id]?.battle?.player;
  }

  async updateBattlePlayer(
    @Ctx() ctx: TelegrafContext,
    battlePlayer: NpcObj,
  ): Promise<NpcObj> {
    const playerData = await this.getStorePlayerData(ctx);
    ctx.scene.state[playerData.player.telegram_id].battle.battlePlayer =
      battlePlayer;
    return ctx.scene.state[playerData.player.telegram_id].battle.battlePlayer;
  }

  async getStorePlayerData(
    @Ctx() ctx: TelegrafContext,
  ): Promise<PlayerDataDto> {
    const telegram_id = this.getTelegramId(ctx);
    if (!ctx.scene?.state[telegram_id]) {
      let player: UsersEntity = await this.usersRepository.findOne({
        where: { telegram_id: telegram_id },
      });
      if (!player) {
        player = (await this.registerNewPlayer(ctx)).player;
      }
      const playerLocation: LocationsEntity =
        await this.locationsRepository.findOne({
          where: { location: player?.location },
        });
      const playerProgress: ProgressEntity =
        await this.progressRepository.findOne({
          where: { user_id: player?.id },
        });
      const playerData: PlayerDataDto = {
        player,
        playerLocation,
        playerProgress,
      };
      ctx.scene.state[telegram_id] = playerData;
      console.log('store initiated for telegram_id: ', telegram_id);
    }
    return ctx.scene.state[telegram_id];
  }

  async getNextChapter(playerData: PlayerDataDto): Promise<ChaptersEntity> {
    const chapterNext: ChaptersEntity = await this.chaptersRepository.findOne({
      where: {
        location: playerData.playerLocation.location,
        code: playerData.playerProgress.chapter_code,
      },
    });
    return chapterNext;
  }

  async getGoalChapter(playerData: PlayerDataDto) {
    const chapterNext: ChaptersEntity = await this.chaptersRepository.findOne({
      where: {
        code: playerData.playerProgress.chapter_code,
      },
    });
    return chapterNext;
  }

  async getCurrentChapter(playerData: PlayerDataDto): Promise<ChaptersEntity> {
    const currentChapter: ChaptersEntity =
      await this.chaptersRepository.findOne({
        where: {
          code: playerData.playerProgress.chapter_code,
        },
      });
    return currentChapter;
  }

  async clearMenuCommands(
    messageText: string,
    chatId: number,
    messageId: number,
  ) {
    const commandList = this.commandList.map((item) => item.command);
    if (
      commandList.includes(messageText.slice(1, messageText.length)) &&
      chatId &&
      messageId
    ) {
      await this.bot.telegram.deleteMessage(chatId, messageId);
    }
  }

  async registerNewPlayer(@Ctx() ctx: TelegrafContext): Promise<PlayerDataDto> {
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
        where: { content: Like('Один из грузовиков%') },
      });
      const playerProgress = await this.progressRepository.save({
        user_id: player.id,
        chapter_code: startChapter.code,
        location: playerLocation.location,
      });
      const playerData: PlayerDataDto = {
        player,
        playerLocation,
        playerProgress,
      };
      ctx.scene.state[telegram_id] = playerData;
      console.log('Player registered. Telegram_id: ', telegram_id);
      await ctx.reply(
        `Вы зарегистрированы в новелле. Используйте команду /display для создания меню игры.
  Дисплей и его команды:

  - Двигайтесь по сюжету через меню "Взаимодействие". Оно доступно в определенных локациях.

  - Меняйте локации с помощью меню "Перемещение".

  - Команда "PDA" подскажет где вы находитесь и куда вам нужно отправиться.

  Остальные команды находятся в разработке, такие как "Бандиты".

  Наш чат в телеграмме https://t.me/stalker_novella
  Наша группа в ВК: https://vk.com/stalker_novella
  `,
      );
      return playerData;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  decrypt(hash) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        Buffer.from(hash.iv, 'hex'),
      );
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
    await this.bot.telegram.setMyCommands(this.commandList);
  }

  escapeText(escapedMsg: string) {
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
    return escapedMsg.replace(
      specialChars,
      (match) => replacements[match] || match,
    );
  }

  // escapeText(escapedMsg: string) {
  //   return escapedMsg;
  //   return escapedMsg
  //     .replace(/_/gim, '\\_')
  //     .replace(/\*\*/gim, '----------')
  //     .replace(/\*/gim, '\\*')
  //     .replace(/----------/gim, '*')
  //     .replace(/\(/gim, '\\(')
  //     .replace(/\)/gim, '\\)')
  //     .replace(/\[/gim, '\\[')
  //     .replace(/\!/gim, '\\!')
  //     .replace(/\`/gim, '\\`')
  //     .replace(/\-/gim, '\\-')
  //     .replace(/\./gim, '\\.')
  //     .replace(/\,/gim, '\\,');
  // }

  async updateDisplay(
    progress: ProgressEntity,
    keyboard: InlineKeyboardMarkup,
    caption?: string,
    photoLink?: string,
  ) {
    try {
      await this.bot.telegram.editMessageMedia(
        progress.chat_id,
        progress.message_display_id,
        null,
        {
          type: 'photo',
          media:
            this.escapeText(photoLink) ||
            this.escapeText(
              'https://media2.giphy.com/media/z6UjsCa1Pq4QoMtkNR/giphy.gif?cid=790b76115ebeebe0c7ac50b73f0eb536c3f7dcaf33451941&rid=giphy.gif&ct=g',
            ), // this.escapeText(photoLink) ||
          caption: this.escapeText(caption) || 'подпись медиа',
        },
      );
      await this.bot.telegram.editMessageReplyMarkup(
        progress.chat_id,
        progress.message_display_id,
        null,
        keyboard,
      );
    } catch (error) {
      console.error(error);
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

  async createBattle(@Ctx() ctx: TelegrafContext): Promise<PlayerDataDto> {
    const playerData: PlayerDataDto = await this.getStorePlayerData(ctx);
    const enemyList = this.genBattleEnemies();
    const battlePlayer = this.genBattlePlayer();
    const playerDataDto: PlayerDataDto = {
      ...playerData,
      battle: { enemyList, battlePlayer },
    };
    ctx.scene.state[playerData.player.telegram_id] = playerDataDto;
    return playerDataDto;
  }

  async getBattle(@Ctx() ctx: TelegrafContext): Promise<PlayerDataDto> {
    const playerData: PlayerDataDto = await this.getStorePlayerData(ctx);
    return ctx.scene.state[playerData.player.telegram_id];
  }

  async updateBattle(
    @Ctx() ctx: TelegrafContext,
    battleData: PlayerDataDto,
  ): Promise<PlayerDataDto> {
    const playerData: PlayerDataDto = await this.getStorePlayerData(ctx);
    const playerDataDto: PlayerDataDto = {
      ...playerData,
      ...battleData,
    };
    ctx.scene.state[playerData.player.telegram_id] = playerDataDto;
    return playerDataDto;
  }

  genBattleEnemies(): NpcObj[] {
    const names = [
      'Васян',
      'Жора',
      'Борян',
      'Колян',
      'Стасик',
      'Петрос',
      'Роберт',
      'Андрюха',
      'Асти',
      'Максон',
      'Максан',
      'Денчик',
      'Витян',
    ];
    const surNames = [
      'Бобр',
      'Жесткий',
      'Кривой',
      'Зануда',
      'Мозила',
      'Пес',
      'Гангстер',
      'Черный',
      'Дикий',
      'Цепной',
      'Шальной',
      'Зеленый',
      'Маслинник',
    ];
    const enemies: NpcObj[] = [];
    // const enemiesTargetCount = Math.floor(Math.random() * 2) + 1;
    const enemiesTargetCount = 1;
    while (enemies?.length !== enemiesTargetCount) {
      const x = Math.floor(Math.random() * 200);
      const y = Math.floor(Math.random() * 200);
      const nameIndex = Math.floor(Math.random() * names?.length);
      const name = names[nameIndex];
      names.splice(nameIndex, 1);
      const surNameIndex = Math.floor(Math.random() * names?.length);
      const surName = surNames[surNameIndex];
      surNames.splice(surNameIndex, 1);
      const fullName = `${name} ${surName}`;
      enemies.push({
        position: { x, y },
        name: fullName,
        isAlive: true,
        health: 75,
        group: 'Бандиты',
        // gun: this.appService.getRandomElInArr(this.guns),
        gun: this.guns[2],
      });
    }
    return enemies;
  }

  genBattlePlayer(): NpcObj {
    return {
      position: {
        x: Math.floor(Math.random() * 200),
        y: Math.floor(Math.random() * 200),
      },
      name: 'Игрок',
      isAlive: true,
      health: 75,
      group: 'Бандиты',
      // gun: this.appService.getRandomElInArr(this.guns),
      gun: this.guns[2],
    };
  }
}
