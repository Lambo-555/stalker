import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction } from 'express';
import {
  Scene,
  SceneEnter,
  SceneLeave,
  Command,
  Hears,
  Ctx,
  Action,
  TELEGRAF_STAGE,
  Next,
  Use,
} from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import { Chapters } from 'src/user/entities/chapters.entity';
import { Choices } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { Progress } from 'src/user/entities/progress.entity';
import { Users } from 'src/user/entities/users.entity';
import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Like, Repository } from 'typeorm';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
import { ActivityEnum } from './enums/activity.enum';
import { ScenesEnum } from './enums/scenes.enum';

// ганг карс
// набираешь тиму, катаешься по району и отстреливаешь наркомафию
// цель игры - собрать тиму, оптимизировать пушки, нанимать норма водителя
// авто могут тормозить, маневрировать, гоняться на скорость
// можно посылать потрульные машины на рейды будучи дома
// сделать район богаче - новая миссия
// чем богаче и умнее район, тем больше примочек на автоматы

@Scene(ScenesEnum.ANOMALY_ROAD)
export class AnomalyRoadScene {
  private readonly logger = new Logger(AnomalyRoadScene.name);

  constructor(
    private readonly appService: AppService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Chapters)
    private readonly chaptersRepository: Repository<Chapters>,
    @InjectRepository(Choices)
    private readonly choicesRepository: Repository<Choices>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(InventoryItems)
    private readonly inventoryItemsRepository: Repository<InventoryItems>,
  ) {}

  @Use()
  async onRegister(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: Users = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    if (user) {
      const progress = await this.progressRepository.findOne({
        where: { user_id: user.id },
      });
      if (!progress) {
        const lastChapter = await this.chaptersRepository.findOne({
          order: { id: 1 },
          where: { content: Like('💭%') },
        });
        await this.progressRepository.save({
          user_id: user.id,
          chapter_id: lastChapter.id,
        });
      }
    } else {
      const userRegistered: Users = await this.usersRepository.save({
        telegram_id: telegram_id,
      });
      const lastChapter = await this.chaptersRepository.findOne({
        order: { id: 1 },
        where: { content: Like('💭') },
      });
      await this.progressRepository.save({
        user_id: userRegistered.id,
        chapter_id: lastChapter.id,
      });
      this.logger.debug(JSON.stringify(userRegistered, null, 2));
    }
    next();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    // TODO use right Tactics to avoid damage from anomaly
    // Если это кисель, то надо тихо идти и не плескаться
    // если это жарка, то лучше пробежать быстрее
    // если то электра, то надо чаще разряжать аномалию болтами
    // если это телепорт, то надо идти компактее
    // если это жгучий пух, то идти надо медленно
    const anomalyList = [
      'Трамплин',
      'Воронка',
      'Карусель',
      'Жарка',
      'Пар',
      'Комета',
      'Электра',
      'Тесла',
      'Кисель',
      'Кислотный туман',
      'Газировка',
      'Химическая комета',
      'Жгучий пух',
      'Пространственный пузырь',
      'Телепорт',
    ];
    await ctx.reply(
      `Вы попали в зону аномалии "${this.appService.getRandomElInArr(
        anomalyList,
      )}". Вы кидаете болты, чтобы выжить и пройти дальше`,
      Markup.inlineKeyboard([
        Markup.button.callback('Выбор направления', 'anomalyWays'),
      ]),
    );
  }

  @Action('anomalyWays')
  async anomalyWays(@Ctx() ctx: TelegrafContext) {
    const ways = ['Влево', 'Направо', 'Прыжок', 'Проползти'];
    await ctx.replyWithHTML(
      `<b>Пути:</b> `,
      Markup.inlineKeyboard(
        [
          Markup.button.callback('Вперед', 'anyWay'),
          ...ways.map(
            (wayName) =>
              Markup.button.callback(wayName, 'anyWay', Math.random() > 0.6),
            // Markup.button.callback(wayName, 'wayXXX' + wayName), // TODO
          ),
        ],
        {
          columns: 2,
        },
      ),
    );
  }

  @Action('anyWay')
  async anyWay(@Ctx() ctx: TelegrafContext) {
    const wayTotal = Math.random() * 100;

    // TODO find random artifact based of type of anomaly
    if (wayTotal < 10) {
      await ctx.replyWithHTML(
        'Болт не сработал. Вы попали в аномалию и получили травму ХХ',
        Markup.inlineKeyboard([
          Markup.button.callback('Выбраться', 'anomalyWays'),
        ]),
      );
    }
    if (wayTotal >= 20 && wayTotal < 20) {
      await ctx.replyWithHTML(
        'Болт упал ровно. Путь безопасен. Нужно двигаться дальше',
        Markup.inlineKeyboard([
          Markup.button.callback('Дальше', 'anomalyWays'),
        ]),
      );
    }
    if (wayTotal >= 20 && wayTotal < 70) {
      await ctx.replyWithHTML(
        'Болт ударился о камень. Тут тупик',
        Markup.inlineKeyboard([
          Markup.button.callback('Обойти', 'anomalyWays'),
        ]),
      );
    }
    if (wayTotal >= 70) {
      await ctx.reply('Все как один болты ложились в роный путь. Вы выбрались');
      await ctx.scene.leave();
    }
  }

  @Action(ScenesEnum.QUEST)
  async enterQuestScene(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.enter(ScenesEnum.QUEST);
  }

  //   @Use()
  //   async actionsMiddleware(
  //     @Ctx() ctx: TelegrafContext,
  //     @Next() next: NextFunction,
  //   ) {
  //     const messageId = ctx?.callbackQuery?.message?.message_id;
  //     if (!ctx.scene.session.state?.hasOwnProperty('lastUsedMessageId')) {
  //       ctx.scene.session.state = { lastUsedMessageId: messageId - 1 };
  //     }
  //     if (messageId > ctx.scene.session.state['lastUsedMessageId']) {
  //       ctx.scene.session.state = { lastUsedMessageId: messageId };
  //     } else {
  //       ctx.reply('Too late for thinking about it.');
  //       return;
  //     }
  //     // try {
  //     //     await ctx.deleteMessage();
  //     // } catch (error) {
  //     //     ctx.reply('error');
  //     // }
  //     const phrases = [
  //       'You are busy.',
  //       'Wait plz.',
  //       'Not now.',
  //       'Need some time.',
  //       'Easy, man, easy.',
  //     ];
  //     const answer = phrases[Math.floor(Math.random() * phrases.length)];
  //     ctx.reply(answer);
  //     next();
  //   }

  @Action('play')
  async market(@Ctx() ctx: Scenes.SceneContext) {
    // const checkCellChance = (chance: number) => {
    //   return Math.random() * 100 >= 100 - chance;
    // };
    // const player: Player = await this.getOrCreateUser(ctx);
    // const cell: Cell = await this.postgresLibService.findOneCell(
    //   player?.cell_id,
    // );
    // const keyboard = this.generateEventList(cell);
    // const enemy = this.generateEnemyList(cell);
    // const roads = await this.generateRoadList(cell);
    // const commonButtuons = [];
    // commonButtuons.push(Markup.button.callback('🍺 MISSION', 'mission'));
    // commonButtuons.push(Markup.button.callback('🔙 TO MENU', 'leave'));
    // commonButtuons.push(Markup.button.callback('🎒 STATS', 'mystats'));
    // if (checkCellChance(cell.npc_enemy_chance)) {
    //   await ctx.reply(
    //     'Oppps, I meet some on my way...',
    //     Markup.inlineKeyboard([enemy]),
    //   );
    // } else {
    //   await ctx.reply(
    //     'What next?',
    //     Markup.inlineKeyboard([
    //       commonButtuons,
    //       keyboard,
    //       ...this.telegramService.menuSplitter(roads, 2),
    //     ]),
    //   );
    // }
  }

  @Action('mystats')
  async mystats(@Ctx() ctx: Scenes.SceneContext) {
    // const player: Player = await this.getOrCreateUser(ctx);
    // const cell: Cell = await this.postgresLibService.findOneCell(
    //   player?.cell_id,
    // );
    // const inventory: Inventory = await this.postgresLibService.findOneInventory(
    //   player?.inventory_id,
    // );
    // let message = '*My stats:*\n';
    // message += `I'm on ${cell.name}\n`;
    // message += `My level is ${player.level}🧠\n`;
    // message += `I have:
    //     scrap - ${inventory.scrap} ⚙️
    //     stone - ${inventory.stone} 🪨
    //     wood - ${inventory.wood} 🪵
    //     sulfur - ${inventory.sulfur} 🌕
    //     cloth - ${inventory.cloth} 🧶
    //     meat - ${inventory.meat} 🍖
    //     stone tool - ${inventory.stoneTool ? 'yes' : 'no'},
    //     scrap tool - ${inventory.scrapTool ? 'yes' : 'no'},
    //     wood tool - ${inventory.woodTool ? 'yes' : 'no'},
    //     transport - ${player.transport},
    //     \n`;
    // await ctx.replyWithMarkdown(
    //   message,
    //   Markup.inlineKeyboard([Markup.button.callback('go', 'play')]),
    // );
  }

  @Action('mission')
  async mission(@Ctx() ctx: Scenes.SceneContext) {
    // const player: Player = await this.getOrCreateUser(ctx);
    // const inventory: Inventory = await this.postgresLibService.findOneInventory(
    //   player?.inventory_id,
    // );
    // const missionStatus = await this.missionsService.switchMission(player);
    // console.log(missionStatus, inventory);
    // const keyBoard = Markup.inlineKeyboard([
    //   Markup.button.callback('Lests do it!', 'play'),
    // ]);
    // // ctx.reply('Lets go spoone... sponsors 🥄', keyBoard);
    // ctx.reply(missionStatus.statusText, keyBoard);
  }

  @Action(new RegExp(ActivityEnum.JOB + '.*', 'gm'))
  async job(@Ctx() ctx: Scenes.SceneContext, @Next() next) {
    // // @ts-ignore
    // const match = ctx.match[0];
    // const jobToDo = match?.slice(SwitchTypeEnum.JOB.length, match.length);
    // if (Object.keys(JobEnum).includes(jobToDo)) {
    //   await ctx.reply('In progress...');
    //   // console.log('yes ', { jobToDo });
    //   const player: Player = await this.getOrCreateUser(ctx);
    //   player.busy = jobToDo;
    //   const playerUpdated = await this.postgresLibService.updateOnePlayer(
    //     player,
    //   );
    //   const job = await this.jobService.switchJob(player);
    //   const keyboard = Markup.inlineKeyboard([
    //     Markup.button.callback('Go next!', 'play'),
    //   ]);
    //   await ctx.reply(job?.message || 'done', keyboard);
    //   // ctx.reply('Lets go spoone... sponsors 🥄', keyBoard);
    // } else {
    //   console.log('not ', { jobToDo });
    // }
    // next();
  }

  //   @Action(new RegExp(SwitchTypeEnum.LOCATION + '.*', 'gm'))
  //   async road(@Ctx() ctx: Scenes.SceneContext, @Next() next) {
  // // @ts-ignore
  // const match = ctx.match[0];
  // const cellId: Cell['id'] = match?.slice(
  //   SwitchTypeEnum.LOCATION.length,
  //   match.length,
  // );
  // if (cellId) {
  //   await ctx.reply('On my way...');
  //   const player: Player = await this.getOrCreateUser(ctx);
  //   player.busy = JobEnum.BUSY;
  //   const playerUpdated = await this.postgresLibService.updateOnePlayer(
  //     player,
  //   );
  //   const nextPoint = await this.roadService.switchLocation(
  //     player,
  //     cellId,
  //     ctx,
  //   );
  //   const keyboard = Markup.inlineKeyboard([
  //     Markup.button.callback('Go next!', 'play'),
  //   ]);
  //   await ctx.reply(nextPoint?.message || 'come', keyboard);
  // } else {
  //   console.log('not ', { cellId });
  // }
  // next();
  //   }

  //   @Action(new RegExp(SwitchTypeEnum.NPC + '.*', 'gm'))
  //   async npc(@Ctx() ctx: Scenes.SceneContext, @Next() next) {
  //     const keyBoard = Markup.inlineKeyboard([
  //       Markup.button.callback('ok, go', 'play'),
  //     ]);
  //     // @ts-ignore // библиотека не видит match в ctx
  //     const match = ctx.match[0];
  //     const npcType: NpcTypeEnum = match?.slice(
  //       SwitchTypeEnum.NPC.length,
  //       match.length,
  //     );
  //     console.log({ npcType, match }, SwitchTypeEnum.NPC.length);
  //     if (Object.keys(NpcTypeEnum).includes(npcType)) {
  //       console.log('yer.fight', { npcType });
  //       const player: Player = await this.getOrCreateUser(ctx);
  //       player.busy = JobEnum.BUSY;
  //       await this.postgresLibService.updateOnePlayer(player);
  //       const npc = await this.npcService.getNpc(player, npcType); // TODO NPC service
  //       if (!npc)
  //         await ctx.reply(
  //           'No animals here.',
  //           Markup.inlineKeyboard([Markup.button.callback('Go next!', 'play')]),
  //         );
  //       if (npc?.type === NpcTypeEnum.ANIMAL_TRANSPORT) {
  //         const userMaster = await this.npcService.masterTransport(player, npc);
  //         ctx.reply(`Nice to ride ${userMaster.transport}`, keyBoard);
  //       }
  //       if (npc?.type === NpcTypeEnum.ANIMAL_ENEMY) {
  //         const fightResult = await this.npcService.fight(player, npc);
  //         ctx.reply(fightResult.message, keyBoard);
  //       }
  //       if (npc?.type === NpcTypeEnum.ANIMAL_NEUTRAL) {
  //         const eatResult = await this.npcService.eat(player, npc);
  //         ctx.reply(eatResult.message, keyBoard);
  //       }
  //     } else {
  //       console.log('not.next', { npcType });
  //     }
  //     next();
  //   }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
    // await ctx.scene.enter(ScenesEnum.QUEST);
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply('Ваш путь продолжается.');
  }
}
