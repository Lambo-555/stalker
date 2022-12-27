import { Inject, Injectable, Logger } from '@nestjs/common';
// import { MongoLibPlayerService } from 'libs/mongo-lib/src';
import {
  Update,
  Command,
  Ctx,
  Use,
  Next,
  Action,
  Message,
} from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { NextFunction } from 'express';
import { TelegrafContext } from 'src/interfaces/telegraf-context.interface';
import { Users } from './user/entities/users.entity';
import { AppService } from './app.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapters } from './user/entities/chapters.entity';
import { Choices } from './user/entities/choices.entity';
import { Progress } from './user/entities/progress.entity';
import { InventoryItems } from './user/entities/inventory_items.entity';

@Update()
@Injectable()
export default class AppUpdate {
  private readonly logger = new Logger(AppUpdate.name);

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

  onApplicationBootstrap() {
    this.appService.commandListInit();
  }

  async getCurrentChapter(userId: number): Promise<Chapters> {
    // Query the progress table to find the current chapter for the user
    const progress = await this.progressRepository.findOne({
      where: { user_id: userId },
    });
    // If the user has no progress, return the first chapter
    if (!progress) {
      return this.chaptersRepository.findOne({ where: { id: 1 } });
    }
    // Otherwise, return the current chapter
    return this.chaptersRepository.findOne({
      where: { id: progress?.chapter_id },
    });
  }

  async getChoices(telegram_id: number): Promise<Choices[]> {
    // Get the current chapter for the user
    const currentChapter = await this.getCurrentChapter(telegram_id);
    // Get the user's inventory
    const user = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    const inventory = new Set(user.inventory.split(','));
    // Get the choices for the current chapter
    const choices = await this.choicesRepository.find({
      where: { chapter_id: currentChapter?.id },
    });
    // Filter the choices based on the user's inventory
    return choices.filter((choice) => {
      const choiceInventory = new Set(choice.inventory_required.split(','));
      return [...inventory].every((item) => choiceInventory.has(item));
    });
  }

  async makeChoice(userId: number, choiceId: number): Promise<Chapters> {
    // Get the chosen choice
    const choice: Choices = await this.choicesRepository.findOne({
      where: { id: choiceId },
    });
    // Update the user's progress
    await this.progressRepository.update(
      { user_id: userId },
      { chapter_id: choice.next_chapter_id },
    );
    // Return the next chapter
    return this.chaptersRepository.findOne({
      where: { id: choice?.next_chapter_id },
    });
  }

  async buyItem(telegram_id: number, itemId: number): Promise<void> {
    // Get the chosen item
    const item = await this.inventoryItemsRepository.findOne({
      where: { id: itemId },
    });
    // Get the user's inventory
    const user = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    // Check if the user has enough funds to purchase the item
    if (user.funds < item?.price) {
      // return 'Нет денег'; // TODO
    }
    // Update the user's inventory and funds
    user.inventory = `${user?.inventory},${item?.name}`;
    user.funds -= item?.price || 0;
    await this.usersRepository.save(user);
  }

  @Use()
  async onRegister(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: Users = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    if (user) {
    } else {
      const userRegistered: Users = await this.usersRepository.save({
        telegram_id: telegram_id,
      });
      this.logger.debug(JSON.stringify(userRegistered, null, 2));
    }
    next();
  }

  @Action('menu')
  async onMenu(@Ctx() ctx: TelegrafContext) {
    const helloText = 'МЕНЮ!'
      ? 'Для вас открыты дополнительные меню'
      : 'Зарегистируйтесь, чтобы получить все возможности бота /registration';
    await ctx.reply(
      helloText,
      Markup.inlineKeyboard(
        [
          Markup.button.callback('🎲 Крутить!', 'game'),
          Markup.button.callback('💰 Пополнить!', 'bank'),
          Markup.button.callback('🔼 Ставка + 50', 'setbetup'),
          Markup.button.callback('🔽 Ставка - 50', 'setbetdown'),
          Markup.button.callback('Регистрация', 'registration'),
        ],
        {
          columns: 2,
        },
      ),
    );
  }

  @Command('chapter')
  @Action('chapter')
  async onChapter(@Ctx() ctx: TelegrafContext) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: Users = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    if (!user) {
      ctx.reply('WHAAAT!');
    } else {
      const chapter: Chapters = await this.getCurrentChapter(user.telegram_id);
      const choises: Choices[] = await this.choicesRepository.find({
        where: { chapter_id: chapter.id },
      });
      // ctx.reply(JSON.stringify(choises));
      await ctx.reply(
        'Choooose',
        Markup.inlineKeyboard(
          [
            ...choises.map((item) =>
              Markup.button.callback(
                item.description?.toString() || 'hello',
                'chapter ' + item?.next_chapter_id, // TODO not number, but hash what encrypt and decript
              ),
            ),
            Markup.button.callback('Menu', 'menu'),
          ],
          {
            columns: 2,
          },
        ),
      );
    }
  }

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
