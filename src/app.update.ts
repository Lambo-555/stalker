import { Injectable, Logger } from '@nestjs/common';
import {
  Update,
  Command,
  Ctx,
  Use,
  Next,
  Action,
  Start,
} from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { NextFunction } from 'express';
import { TelegrafContext } from 'src/interfaces/telegraf-context.interface';
import { AppService } from './app.service';
import { ChaptersEntity } from './database/entities/chapters.entity';
import { ScenesEnum } from './scenes/enums/scenes.enum';
import { PlayerDataDto } from './common/player-data.dto';

@Update()
@Injectable()
export default class AppUpdate {
  private readonly logger = new Logger(AppUpdate.name);

  constructor(private readonly appService: AppService) {}

  onApplicationBootstrap() {
    this.appService.commandListInit();
  }

  /**
   * Регистрация пользователя
   * @param ctx Контекст телеграмма
   * @param next Продолжение игры
   */
  @Use()
  async onUse(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    try {
      // @ts-ignore
      const messageId = ctx?.update?.message?.message_id;
      // @ts-ignore
      const chatId = ctx?.update?.message?.chat.id;
      // @ts-ignore
      const menuMessage = ctx?.update?.message?.text;
      if (menuMessage) {
        await this.appService.clearMenuCommands(menuMessage, chatId, messageId);
      }
      await this.appService.getStorePlayerData(ctx);
      next();
    } catch (error) {
      console.error(error);
    }
  }

  @Command('/display')
  async onDisplay(@Ctx() ctx: TelegrafContext) {
    try {
      const playerData: PlayerDataDto =
        await this.appService.getStorePlayerData(ctx);
      const imgLink = this.appService.escapeText('https://clck.ru/33PBvE');
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Начало', 'menu'),
      ]).reply_markup;
      const messageDisplay = await ctx.replyWithPhoto(imgLink, {
        caption: 'display',
        // @ts-ignore
        has_spoiler: true,
        // @ts-ignore
        reply_markup: keyboard,
      });
      ctx.scene.state[playerData.player.telegram_id] =
        await this.appService.updateStorePlayer(ctx, {
          ...playerData.player,
          chat_id: messageDisplay.chat.id,
          message_display_id: messageDisplay.message_id,
        });
    } catch (error) {
      await ctx.reply('Ошибка создания монитора');
      console.log('cant create monitor');
      console.error(error);
    }
  }

  @Start()
  @Action('menu')
  @Command('menu')
  async onMenu(@Ctx() ctx: TelegrafContext) {
    try {
      const playerData: PlayerDataDto =
        await this.appService.getStorePlayerData(ctx);
      const chapterNext: ChaptersEntity = await this.appService.getNextChapter(
        playerData,
      );
      const keyboardButtons: any[] = [];
      keyboardButtons.push(
        Markup.button.callback('📍Перемещение', ScenesEnum.SCENE_LOCATION),
      );
      keyboardButtons.push(
        Markup.button.callback('📟PDA', ScenesEnum.SCENE_PDA),
      );
      keyboardButtons.push(
        Markup.button.callback(
          '☢️Взаимодействие',
          ScenesEnum.SCENE_QUEST,
          !!!chapterNext,
        ),
      );
      const keyboard = Markup.inlineKeyboard(keyboardButtons, {
        columns: 1,
      }).reply_markup;

      this.appService.updateDisplay(
        playerData?.player,
        keyboard,
        this.appService.escapeText(
          `Вы на локации: ${playerData?.playerLocation?.location}.`,
        ),
        playerData?.playerLocation?.image,
      );
    } catch (error) {
      console.error(error);
    }
  }

  @Action(/^scene.*/gim)
  async enterBanditScene(@Ctx() ctx: Scenes.SceneContext) {
    // @ts-ignore
    const match = ctx.match[0];
    if (match) {
      const scene: ScenesEnum = match;
      await ctx.scene.enter(scene);
    }
    return;
  }

  // @Action(ScenesEnum.SCENE_PDA)
  // @Command(ScenesEnum.SCENE_PDA)
  // async enterPdaScene(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.scene.enter(ScenesEnum.SCENE_PDA);
  // }
  // @Action(ScenesEnum.SCENE_ANOMALY_ROAD)
  // @Command(ScenesEnum.SCENE_ANOMALY_ROAD)
  // async enterAnomalyRoadScene(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.scene.enter(ScenesEnum.SCENE_ANOMALY_ROAD);
  // }
  // @Action(ScenesEnum.SCENE_MUTANT)
  // @Command(ScenesEnum.SCENE_MUTANT)
  // async enterMutantScene(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.scene.enter(ScenesEnum.SCENE_MUTANT);
  // }
  // @Action(ScenesEnum.SCENE_ARTIFACT)
  // @Command(ScenesEnum.SCENE_ARTIFACT)
  // async enterArtefactScene(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.scene.enter(ScenesEnum.SCENE_ARTIFACT);
  // }
  // @Action(ScenesEnum.SCENE_LOCATION)
  // @Command(ScenesEnum.SCENE_LOCATION)
  // async enterLocationScene(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.scene.enter(ScenesEnum.SCENE_LOCATION);
  // }
  // @Action(ScenesEnum.SCENE_QUEST)
  // @Command(ScenesEnum.SCENE_QUEST)
  // async enterQuestScene(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.scene.enter(ScenesEnum.SCENE_QUEST);
  // }
  // Markup.button.callback('🔩Аномалия', ScenesEnum.ANOMALY_ROAD),
  // Markup.button.callback('🐫Мутант', ScenesEnum.MUTANT),
  // Markup.button.callback('🤷Бандиты', ScenesEnum.BANDIT),
  // Markup.button.callback('🥦Артефакт', ScenesEnum.ARTIFACT),
  // await ctx.replyWithHTML(
  //   `Вы на локации: <b>${locations?.name}</b>.`,
  //   Markup.inlineKeyboard(
  //     [
  //       // Markup.button.callback('🔩Аномалия', ScenesEnum.ANOMALY_ROAD),
  //       // Markup.button.callback('🐫Мутант', ScenesEnum.MUTANT),
  //       // Markup.button.callback('🤷Бандиты', ScenesEnum.BANDIT),
  //       // Markup.button.callback('🥦Артефакт', ScenesEnum.ARTIFACT),
  //       Markup.button.callback('📍Перемещение', ScenesEnum.LOCATION),
  //       Markup.button.callback('📟PDA', 'PDA'),
  //       Markup.button.callback('☢️История', ScenesEnum.QUEST, !!!nextChapter),
  //     ],
  //     {
  //       columns: 2,
  //     },
  //   ),
  // );
  // @Action(/chapterXXX.*/gim)
  // async onChoose(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
  //   const match = ctx.match[0];
  //   if (!match) next();
  //   console.log('match', match);
  //   const selectedChapterId = +match.split('XXX')[1]; // chapterXXX1
  //   console.log('choiseId', selectedChapterId);
  //   const telegram_id: number =
  //     ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
  //   const user: Users = await this.usersRepository.findOne({
  //     where: { telegram_id: telegram_id },
  //   });

  //   let progress: Progress = await this.progressRepository.findOne({
  //     where: {
  //       user_id: user.id,
  //     },
  //   });
  //   console.log('progress1', progress);

  //   // if (progress.chapter_id > nextChapterId) {
  //   //   await ctx.reply(
  //   //     'Этот выбор вы уже сделали',
  //   //     Markup.inlineKeyboard([Markup.button.callback('Menu', 'menu')], {
  //   //       columns: 2,
  //   //     }),
  //   //   );
  //   //   return;
  //   // }

  //   await this.progressRepository.update(progress.progress_id, {
  //     chapter_id: selectedChapterId,
  //   });

  //   progress = await this.progressRepository.findOne({
  //     where: {
  //       user_id: user.id,
  //     },
  //   });
  //   console.log('progress2', progress);

  //   const newChapter: Chapters = await this.chaptersRepository.findOne({
  //     where: { id: progress.chapter_id },
  //   });
  //   console.log('newChapter', newChapter);

  //   const choises: Choices[] = await this.choicesRepository.find({
  //     where: { chapter_id: newChapter.id },
  //   });
  //   console.log('choiseschoises', choises);

  //   choises.forEach(async (item) => {
  //     const chapter = await this.chaptersRepository.findOne({
  //       where: { id: item.chapter_id },
  //     });
  //     return {
  //       ...item,
  //       description: chapter.character,
  //     };
  //   });

  //   await ctx.replyWithHTML(
  //     `<b>${newChapter.character}:</b> ${newChapter.content}`,
  //     Markup.inlineKeyboard(
  //       [
  //         // ...choises.map((item) =>
  //         //   Markup.button.callback(
  //         //     item?.description || 'neeext',
  //         //     'chapterXXX' + item.next_chapter_id.toString(),
  //         //   ),
  //         // ),
  //         Markup.button.callback('🍔Меню', 'menu'),
  //         Markup.button.callback('♻️Обход аномалий', ScenesEnum.ANOMALY_ROAD),
  //         Markup.button.callback('🐫Встреча с мутантом', ScenesEnum.MUTANT),
  //         Markup.button.callback('🥦Поиск артефактов', ScenesEnum.ARTIFACT),
  //         Markup.button.callback('📍Перемещение', ScenesEnum.LOCATION),
  //         Markup.button.callback('🤙Диалог', ScenesEnum.QUEST),
  //       ],
  //       {
  //         columns: 1,
  //       },
  //     ),
  //   );
  // }
  /**
   * Выберите сумму вашей ставки.
Вращайте барабаны, нажав на кнопку "Spin".
Барабаны будут вращаться и останавливаться случайным образом, чтобы выпадала комбинация символов.
Если комбинация символов соответствует выигрышной комбинации, вы получите выплату в соответствии с таблицей выплат.
Вы можете продолжить игру, снова прокрутив барабаны, или забрать свой выигрыш и выйти из игры.
   * 
   * 
   * 
   * 
   */

  // // @Command('game')
  // @Action('game')
  // async cobalt(@Ctx() ctx: Scenes.SceneContext) {
  //   if (!ctx?.scene?.current?.id) {
  //     await ctx.reply('Welcome back!');
  //     await ctx.scene.enter(ScenesEnum.COBALT_SCENE);
  //   } else {
  //     await ctx.reply(ctx?.scene?.current?.id);
  //   }
  // }

  // // @Command('help')
  // @Action('help')
  // async help(@Ctx() ctx: Scenes.SceneContext) {
  //   await ctx.replyWithMarkdown(
  //     `Hello! Its a *Cobalt game* series.\n\nFor now you can enter to the gambling slots ♥️ directly or play in story mode 🎮.\nStory mode can give you new slots machines, some of them wip for now.\n\n*Important!* You can not call main menu commands then you playing, you can push only last sended buttons, not old one.\nIf something goes wrong just leave the games to main menu and try again.\n\n🗝You also can register your Ethereum wallet, deposit some ETHs for support me, withdraw jackpot ETHs in future.`,
  //   );
  // }

  // // @Command('gambling')
  // @Action('gambling')
  // async gambling(@Ctx() ctx: Scenes.SceneContext) {
  //   if (!ctx?.scene?.current?.id) {
  //     await ctx.reply('Welcome back!');
  //     await ctx.scene.enter(ScenesEnum.GAMBLING_SCENE);
  //   } else {
  //     await ctx.reply(ctx?.scene?.current?.id);
  //   }
  // }

  // @Command('/start') // USE ON END OF PROGRAM
  // async actionsMiddleware(
  //   @Ctx() ctx: TelegrafContext,
  //   @Next() next: NextFunction,
  // ) {
  //   await this.telegramService.commandListInit();
  //   await ctx.reply(
  //     'You are in main menu. For play press "game" button. For find already reached gambling machines press "gambling"',
  //     Markup.inlineKeyboard(
  //       [
  //         Markup.button.callback('🍭 help', 'help'),
  //         Markup.button.callback('🎮 storymode game', 'game'),
  //         Markup.button.callback('♥️ gambling slots', 'gambling'),
  //         Markup.button.callback('🗝 Ethereum registration', 'registration'),
  //       ],
  //       { columns: 1 },
  //     ),
  //   );
  //   next();
  // }

  // @Start()
  // async initPlayer(@Ctx() ctx: Scenes.SceneContext) {
  //     // console.log( JSON.stringify(ctx.message, null, 2));
  //     if (!ctx) return null;
  //     const playerId: PlayerModel['telegram_id'] = +ctx?.message?.from?.id;
  //     const playerDto: PlayerModel = {
  //         telegram_id: +playerId,
  //         capital: 0,
  //         scene: ScenesEnum.SLOT_SCENE,
  //         name: ctx?.message?.from?.first_name,
  //     }
  //     const player = await this.mongoLibPlayerService.getPlayerBytelegram_id(playerId);
  //     if (player?.telegram_id) {
  //         await ctx.reply(`Hello again, ${player?.name || 'player'}!`);
  //         await ctx.scene.enter(player.scene as ScenesEnum);
  //     } else {
  //         const newPlayer = await this.mongoLibPlayerService.createPlayer(playerDto);
  //         await ctx.reply(`Welocome to casino, ${newPlayer?.name || 'new player'}!`);
  //         await ctx.scene.enter(newPlayer.scene as ScenesEnum);
  //     }
  // }

  // @Command('/stats')
  // async stats(@Ctx() ctx: Scenes.SceneContext) {
  //     const playerId: PlayerModel['telegram_id'] = +ctx?.message?.from?.id;
  //     const player = await this.mongoLibPlayerService.getPlayerBytelegram_id(playerId);
  //     await ctx.reply(`Your capital: ${player?.capital} !`);
  // }

  // @Command('/slot')
  // async slot(@Ctx() ctx: Scenes.SceneContext) {
  //     await ctx.scene.enter(ScenesEnum.SLOT_SCENE);
  // }

  // @Command('/peace')
  // async peace(@Ctx() ctx: Scenes.SceneContext) {
  //     // console.log(ctx.message);
  //     await ctx.scene.enter(ScenesEnum.TEST_SCENE);
  // }

  // @Command('/invest')
  // async invest(@Ctx() ctx: Scenes.SceneContext) {
  //     const playerId: PlayerModel['telegram_id'] = +ctx?.message?.from?.id;
  //     const player = await this.mongoLibPlayerService.getPlayerBytelegram_id(playerId);
  //     if (!player) {
  //         ctx.reply('You account not registered. Send comman /start');
  //     } else {
  //         await ctx.reply(`Your capital was: ${player.capital} !`);
  //         player.capital = player.capital + 500;
  //         this.mongoLibPlayerService.updatePlayer(player);
  //         await ctx.reply(`Your capital for now: ${player.capital} !`);
  //     }
  // }

  // @Command('/test')
  // start(ctx: Scenes.SceneContext) {
  //     ctx.scene.enter('test');
  // }

  // @Hears(/.*/img)
  // async phrase(@Ctx() ctx: TelegrafContext, @Message() message, @Sender() sender) {
  //     if (this.playerCtx) {
  //         const options = this.playerCtx?.options?.filter(item => item.option === message.text);
  //         const phraseId = options[0].id;
  //         const actor: ActorDocument = await this.appService.getActorBytelegram_id(sender.id);
  //         const resultOfUpdate = await this.appService.setActorStoryPlace(actor._id, phraseId);
  //         this.renderPhrase(ctx, sender, phraseId || '62d482b8e724418dca4c9737');
  //     } else {
  //         await ctx.reply('End of dialog. Try again /game');
  //     }
  // }

  // async renderPhrase(@Ctx() ctx: TelegrafContext, @Sender() sender, phraseId) {
  //     const phrase = await this.appService.getDialogPhrase(phraseId);
  //     this.playerCtx = phrase;
  //     if (!phrase) ctx.reply('Catn find phrase');
  //     for (let i = 0; i < phrase.phrases.length; i++) {
  //         const phraseToSend = phrase.phrases[i];
  //         await ctx.replyWithMarkdown(`*${phraseToSend.actorName}*: ${phraseToSend.text}`);
  //         // await this.sleep(phraseToSend.text.length * 20);
  //     }
  //     if (phrase.options.length === 0) {
  //         await ctx.reply('End of dialog. Try /game');
  //     } else {
  //         // @ts-ignore
  //         await ctx.reply('Ваш выбор:', Markup.keyboard(phrase.options.map(item => item.option)).oneTime().resize());
  //     }
  // }

  // await ctx.reply(JSON.stringify(ctx.message, null, 2));
  // options: [
  //   {
  //     option: 'На север',
  //     id: new ObjectId("62d86816e080dff2bfa9e954")
  //   },
  //   { option: 'В топь', id: new ObjectId("62d86892e080dff2bfa9e956") },
  //   {
  //     option: 'На запад',
  //     id: new ObjectId("62d4833ee724418dca4c973b")
  //   }
  // ]

  // @Command('/setid') // событие при вводе текста, начинающегося с "/"
  // async updatetelegram_id(
  //     @Ctx() ctx: TelegrafContext, // главный контекст выполнения бота
  //     @Sender('first_name') firstName: string // данные пользовательского сообщения
  // ) {
  //     await ctx.reply(JSON.stringify(ctx.message, null, 2));
  // }

  // @Hears(/[A-Xa-x0-9]{24}/) // регулярное выражение
  // async hearsRegex2(@Ctx() ctx: TelegrafContext, @Message() message, @Sender() sender) {
  //     const result = await this.telegramService.updateActortelegram_id(sender.id, message.text);
  //     if (result) {
  //         await ctx.reply(JSON.stringify(result, null, 2));
  //     } else {
  //         await ctx.reply('Telegram ID not updated');
  //     }
  // }

  // @Start()
  // async start(@Ctx() ctx: TelegrafContext) {
  //     // 1. reply - эхо, отправляет сообщение на id отправителя
  //     // 2. await позволяет отправлять сообщения по очереди
  //     // иначе последовательность может потеряться
  //     await ctx.reply('Welcome to Sfxdx documentation');
  //     // На одно событие можно отправить сколько угодно ответов
  //     // в том числе кнопоки/стикеры/файлы/action чата/запрос на оплату итд
  //     await ctx.reply('Welcome');
  //     await ctx.replyWithHTML('<b>Welcome</b>'); // урезанный синтаксис HTML
  //     await ctx.replyWithMarkdown('**Welcome**'); // урезанный синтаксис MarkDown
  //     // Примеры форматирования текста, подробности есть в меню
  //     // *bold \*text*
  //     // _italic \*text_
  //     // __underline__
  //     await ctx.reply('Welcome');
  // }

  // @UseGuards(AdminGuard) // событие или "роут", который доступен только администратору бота
  // @Command('/admin') // событие при вводе текста, начинающегося с "/"
  // async onAdminCommand(
  //     @Ctx() ctx: TelegrafContext, // главный контекст выполнения бота
  //     @Sender('first_name') firstName: string // данные пользовательского сообщения
  // ) {
  //     await ctx.reply(
  //         `Hey admin ${firstName}`, // отправка имени пользователя в ответ на его команду "/admin".
  //         Markup.inlineKeyboard([ // отправка группы inline кнопок в виде сообщения
  //             Markup.button.callback(
  //                 '🚀 notify', // название кнопки, которое отобразится в мессенджере
  //                 'notification' // название команды, которая выполнится при нажатии
  //                 // в данном случае вызовется команда "/notification"
  //             ),
  //             // третий аргумент принимает true или false
  //             // он отвечает за то, показывать кнопку или нет
  //         ]));
  // }

  // @Help()
  // async help(@Ctx() ctx: TelegrafContext) {
  //     await ctx.reply('Send me a sticker');
  // }

  // @On('sticker')
  // async on(@Ctx() ctx: TelegrafContext) {
  //     await ctx.reply('👍');
  // }

  // @Hears('hi')
  // async hears(@Ctx() ctx: TelegrafContext) {
  //     await ctx.reply('Hey there');
  // }

  // @Hears('Sfxdx') // строка
  // async hearsString(@Ctx() ctx: TelegrafContext) {
  //     await ctx.reply('я нашел твою строку')
  // }

  // @Hears(['Sfxdx', 'Google', 'Mazda 6']) // массив строк
  // async hearsArray(@Ctx() ctx: TelegrafContext) {
  //     await ctx.reply('я нашел одну из твоих строк')
  // }

  // @Hears(/[A-Xa-x0-9]{66}/) // регулярное выражение
  // async hearsRegex(@Ctx() ctx: TelegrafContext) {
  //     await ctx.reply('я нашел transactionHash через регулярные выражения')
  // }

  // // Markup.button.callback('textInsideButton', 'buttonClickEvent') // => создает событие 'buttonClickEvent'
  // @Action('buttonClickEvent')
  // onButtonClickEvent(ctx: TelegrafContext) {
  //     ctx.reply('2+2=?', Markup.keyboard([{ text: 'hello' }]));
  // }

  // @Command('scene')
  // async onSceneCommand(@Ctx() ctx: TelegrafContext): Promise<void> {
  //     await ctx.scene.enter('UNIQ_SCENE_ID');SLOT_SCENE
  // }

  // // проследить update оплаты созданные внутри сцены возможно только на глобальном уровне,
  // // а не на уровне самой сцены. Для отслеживания стоит использовать Payload оплаты,
  // // куда можно вписать пользователя, сцену, данные о товаре.

  // async extra(@Ctx() ctx: TelegrafContext) {
  //     // ctx.wizard.state // получение state => {}
  //     // ctx.wizard.state.age = 77 // присвоение значения для нового свойства age
  //     // return ctx.wizard.state.age // получение age => 77

  //     const buttonArrayOfStrings = [
  //         '7', '8', '9', '*',
  //         '4', '5', '6', '/',
  //         '1', '2', '3', '-',
  //         '0', '.', '=', '+',
  //     ];

  //     // отвечает текстом с клавиатурой. Кнопки отображаются на панели кнопок
  //     ctx.reply(
  //         'Текст без форматирования', // нельзя выслать клавиатуру без текста
  //         // превращает массив строк в массив кнопок
  //         // кнопки помогают пользователю вводить данные не вручную
  //         Markup.keyboard(
  //             buttonArrayOfStrings,
  //             { // конфиг
  //                 columns: 4 // на сколько колонок разделить клавиатуру
  //             }) //
  //             .oneTime() // клавиатура закроется после нажатия на любую из кнопок
  //             .resize(), // масштабирует клавиатуру, если та не влезает в панель кнопок
  //     );
  //     await ctx.replyWithHTML(
  //         '<b>Текст с форматированием HTML</b>',
  //         Markup.inlineKeyboard([ // отправка inline клавиатуры
  //             Markup.button.callback('🔙', 'leave'), // пример callback кнопки, которая выполнит экшн leave
  //         ]));
  // }
  // @Action('quiz')
  // async onQuiz(@Ctx() ctx: TelegrafContext) {
  //     await ctx.scene.enter('QUIZ_WIZARD_ID'); // указываем название сцены для входа
  // }
  // doSomething(@Ctx() ctx: TelegrafContext) {
  //     try {
  //         true
  //     } catch (error) {
  //         //уведомляем пользователя об ошибке, чтобы он понимал, что делать дальше
  //         ctx.reply(`Упс, что-то пошло не так... ${error.message}. Попробуй заполнить поле "почта" еще раз`);
  //         //уведомляем администратора сервера о возникающих ошибках
  //         this.logger.log('Doing something...');
  //     }
  // }
}
