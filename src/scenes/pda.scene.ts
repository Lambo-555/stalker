import { Logger } from '@nestjs/common';
import { NextFunction } from 'express';
import { Scene, SceneEnter, Command, Ctx, Action, Next } from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import { PlayerDataDto } from 'src/common/player-data.dto';
import { ChaptersEntity } from 'src/database/entities/chapters.entity';
import { GunsEntity } from 'src/database/entities/guns.entity';
import { Markup, Scenes } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
import { ScenesEnum } from './enums/scenes.enum';

@Scene(ScenesEnum.SCENE_PDA)
export class PdaScene {
  private readonly logger = new Logger(PdaScene.name);

  constructor(private readonly appService: AppService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    // const nextChapter: ChaptersEntity = await this.appService.getNextChapter(
    //   playerData,
    // );
    const nextChapter: ChaptersEntity = await this.appService.getGoalChapter(
      playerData,
    );
    const nextLocation = await this.appService.getLocation(
      nextChapter.location,
    );
    const guns: GunsEntity[] = await this.appService.getGunList();

    const keyboard = Markup.inlineKeyboard(
      [
        ...guns.map((gun: GunsEntity) =>
          Markup.button.callback(gun.name, 'gunXXX' + gun.name),
        ),
        Markup.button.callback('📟Меню', 'menu'),
      ],
      {
        columns: 2,
      },
    ).reply_markup;
    const pdaMenu = `
📟 Вы смотрите в свой КПК(PDA)

Воля: ${playerData?.player?.will}

Текущая локация: ${playerData.playerLocation.location}
Целевая локация: ${nextLocation.location}`;
    await this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      pdaMenu,
      playerData.playerLocation.image,
    );
  }

  @Action('my_callback_query')
  handleCallbackQuery(ctx: TelegrafContext) {
    ctx.answerCbQuery('Response message', {
      show_alert: true,
      cache_time: 500,
    });
  }

  @Action(/gunXXX.*/gim)
  async onChooseGun(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const match = ctx.match[0];
    if (!match) next();
    const selectedGunName: string = match.split('XXX')[1];
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    const currentGun: GunsEntity = await this.appService.getGunByName(
      selectedGunName,
    );
    if (currentGun) {
      playerData.player.gun = selectedGunName;
      await this.appService.updateStorePlayer(ctx, playerData.player);
      ctx.answerCbQuery(
        `Теперь вы носите ${currentGun.name}, оптимальная дистанция ${currentGun.optimal_distance}m`,
        {
          show_alert: true,
          cache_time: 500,
        },
      );
    } else {
      ctx.answerCbQuery(`${selectedGunName} недоступно`, {
        show_alert: false,
        cache_time: 500,
      });
    }
  }

  // const x = `
  //     . Версия прошивки "${pdaVersion}
  //   Средства: ${ user.funds }🛢,
  // Здоровье: ${ user.health }🫀, Радиация: ${ user.radiation }☢️,
  // Кровотечение: ${ 0 }🩸, Пси - состояние: ${ 100 }🧠,
  // 📱 /about - О КПК
  // 🎒 /inventory - Рюкзак (wip)
  // 📻 /radioTune - Настройка волны радио (только для версии прошивки <b>PDA-X16</b >)
  // 📍 /location - Текущая локация
  // 🪬 /quest - Текуший квест-задача, её локация
  // 🎟💴 /buyTickets - Купить билеты проводников (wip)
  // 🔑💳 /crypto - Подключение крипто-кошельков (wip)
  // 🕯 /chat - Доступ V чат сталкеров (wip торговля)
  // 🗺 /map - Просмотр пройденного пути на карте Зоны (wip)
  // 🎭 /art - Арты про STALKER (wip)
  // 🆘 /help - Помощь и пояснения
  // 📊 /statistics - Статистика игрока (wip)
  // 💡 /feedback - Написать отзыв об ошибках и предложениях
  // 💡 /creators - Написать отзыв об ошибках и предложениях`;
  //   }
  //   @Command('/creators')
  //   async onCreators(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
  //     await ctx.replyWithHTML(`
  // <b>Список разработчиков:</b>
  // - Малышев Станислав - director, backend-developer
  //     `);
  //   }
  //   @Command('/help')
  //   async onHelp(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
  //     await ctx.replyWithHTML(`
  // <b>Помощь:</b>
  // Данная игра - новелла по сюжету игры Сталкер.
  // Чтобы пройти сюжет нужно переходить в нужные локации и вести диалог с NPC.
  // Текущую локацию и место, куда нужно уйти можно узать в PDA.
  // Ряд фраз изменены, чтобы помещаться в лимиты телеграмма по кнопкам.
  // На данный момент решения игрока ни на что не влияют, но ведется разработка кармы, которая будет влиять на концовки и возможности выбрать то или иное решение в диалогах.
  // `);
  //   }
  //   @Command('/about')
  //   async onAbout(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
  //     await ctx.reply(
  //       `
  // КПК, он же PDA - самый распространенный девайс в Зоне. Причин тому несколько:
  // - другие устройства не работают при воздействии столь мощной радиации и аномалий
  // - данная модель выпущена огромным тиражем, дешева и часто "передается по наследству"
  // - более подобных КПК не выпускают, на них стоит запрет, как и на все сталкерское
  // - мастера меняют лишь версии прошивки, но не создают само железо
  // - функций КПК хватает, разве что артефакты он не ищет, но это пока что

  // Без пароля от КПК не достать нужные данные. Удается лишь считать последние открытые вкладки.
  // Увесистая вышла штука. Но в целом ценная вещь, ее стоит беречь.

  // 📱 /reenter - Меню КПК
  // 🚪 /leave - Выход в основное меню
  //       `,
  //     );
  //   }
  // @Action(/artifactXXX.*/gim)
  // async onChoose(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
  //   const match = ctx.match[0];
  //   if (!match) next();
  //   const anomalyId = +match.split('XXX')[1]; // chapterXXX1
  //   const anomalyAll: Anomalies[] = await this.anomaliesRepository.find();
  //   const anomalyTarget: Anomalies = anomalyAll.filter(
  //     (item) => item.id === anomalyId,
  //   )[0];
  //   const anomalyEffects = Array.from(
  //     new Set(anomalyAll.map((item) => item.effects)),
  //   );
  //   await ctx.reply(
  //     `Аномалия, в которой находится артефакт: ${anomalyTarget.name}`,
  //     Markup.inlineKeyboard(
  //       [
  //         ...anomalyEffects.map((anomalyItem) =>
  //           Markup.button.callback(
  //             anomalyItem,
  //             anomalyItem === anomalyTarget.effects
  //               ? 'anomalyTrue'
  //               : 'anomalyFalse',
  //           ),
  //         ),
  //         Markup.button.callback('Меню', 'menu'),
  //       ],
  //       {
  //         columns: 1,
  //       },
  //     ),
  //   );
  // }
  // @Action('anomalyTrue')
  // async anomalyTrue(@Ctx() ctx: TelegrafContext) {
  //   const wayTotal = Math.random() * 100;
  //   if (wayTotal >= 60) {
  //     await ctx.reply('Отлично, короб подошел, артефакт ведет себя стабильно.');
  //     await ctx.scene.leave();
  //   } else {
  //     await ctx.reply(
  //       'Отлично, короб подошел, но артефакт был нестабилен и иссяк.',
  //       // Markup.inlineKeyboard([Markup.button.callback('Меню', 'menu')]),
  //     );
  //     await ctx.scene.leave();
  //   }
  // }

  @Action('leave')
  @Command('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
    // await ctx.scene.enter(ScenesEnum.QUEST);
  }

  // @SceneLeave()
  // async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
  //   const telegram_id: number =
  //     ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
  //   const user: UsersEntity = await this.usersRepository.findOne({
  //     where: { telegram_id: telegram_id },
  //   });
  //   const progress: ProgressEntity = await this.progressRepository.findOne({
  //     where: {
  //       user_id: user.id,
  //     },
  //   });
  //   const keyboard = Markup.inlineKeyboard([
  //     Markup.button.callback('Меню', 'menu'),
  //   ]).reply_markup;
  //   await this.appService.updateDisplay(
  //     progress,
  //     keyboard,
  //     `КПК(PDA) закрыт`,
  //     // location.image,
  //   );
  // }
}
