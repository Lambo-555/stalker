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
import { Anomalies } from 'src/user/entities/anomalies.entity';
import { Artifacts } from 'src/user/entities/artifacts.entity';
import { ChaptersEntity } from 'src/user/entities/chapters.entity';
import { Choices } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { UsersEntity } from 'src/user/entities/users.entity';
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

@Scene(ScenesEnum.ARTIFACT)
export class ArtefactScene {
  private readonly logger = new Logger(ArtefactScene.name);

  constructor(
    private readonly appService: AppService,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(ChaptersEntity)
    private readonly chaptersRepository: Repository<ChaptersEntity>,
    @InjectRepository(Choices)
    private readonly choicesRepository: Repository<Choices>,
    @InjectRepository(ProgressEntity)
    private readonly progressRepository: Repository<ProgressEntity>,
    @InjectRepository(InventoryItems)
    private readonly inventoryItemsRepository: Repository<InventoryItems>,
    @InjectRepository(Artifacts)
    private readonly artifactsRepository: Repository<Artifacts>,
    @InjectRepository(Anomalies)
    private readonly anomaliesRepository: Repository<Anomalies>,
    @InjectRepository(LocationsEntity)
    private readonly locationsRepository: Repository<LocationsEntity>,

  ) {}

  @Use()
  async onRegister(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: UsersEntity = await this.usersRepository.findOne({
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
      const location = await this.locationsRepository.findOne({
        where: { name: 'Кордон' },
      });
      const userRegistered: UsersEntity = await this.usersRepository.save({
        telegram_id: telegram_id,
        location: location.id,
      });
      const lastChapter = await this.chaptersRepository.findOne({
        order: { id: 1 },
        where: { content: Like('💭') },
      });
      await this.progressRepository.save({
        user_id: userRegistered.id,
        chapter_id: 90, // lastChapter.id,
        location: location.id,
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
    const artList: Artifacts[] = await this.artifactsRepository.find();
    const randArt: Artifacts = this.appService.getRandomElInArr(artList);
    await ctx.reply(
      `Вы возле артефакта: "${randArt.name}". Нужно его правильно запереть в короб. Материал покрытия крайне важен.`,
      Markup.inlineKeyboard([
        Markup.button.callback(
          'Выбор короба.',
          'artifactXXX' + randArt.anomaly,
        ),
      ]),
    );
  }

  @Action(/artifactXXX.*/gim)
  async onChoose(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const match = ctx.match[0];
    if (!match) next();
    const anomalyId = +match.split('XXX')[1]; // chapterXXX1
    const anomalyAll: Anomalies[] = await this.anomaliesRepository.find();
    const anomalyTarget: Anomalies = anomalyAll.filter(
      (item) => item.id === anomalyId,
    )[0];
    const anomalyEffects = Array.from(
      new Set(anomalyAll.map((item) => item.effects)),
    );
    // const telegram_id: number =
    // ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    // const user: Users = await this.usersRepository.findOne({
    // where: { telegram_id: telegram_id },
    // });
    await ctx.reply(
      `Аномалия, в которой находится артефакт: ${anomalyTarget.name}`,
      Markup.inlineKeyboard(
        [
          ...anomalyEffects.map((anomalyItem) =>
            Markup.button.callback(
              anomalyItem,
              anomalyItem === anomalyTarget.effects
                ? 'anomalyTrue'
                : 'anomalyFalse',
            ),
          ),
          Markup.button.callback('🍔Меню', 'menu'),
        ],
        {
          columns: 1,
        },
      ),
    );
  }

  @Action('anomalyTrue')
  async anomalyTrue(@Ctx() ctx: TelegrafContext) {
    const wayTotal = Math.random() * 100;
    if (wayTotal >= 60) {
      await ctx.reply('Отлично, короб подошел, артефакт ведет себя стабильно.');
      await ctx.scene.leave();
    } else {
      await ctx.reply(
        'Отлично, короб подошел, но артефакт был нестабилен и иссяк.',
        // Markup.inlineKeyboard([Markup.button.callback('🍔Меню', 'menu')]),
      );
      await ctx.scene.leave();
    }
  }

  @Action('anomalyFalse')
  async anomalyFalse(@Ctx() ctx: TelegrafContext) {
    await ctx.reply(
      'Короб не подошел, артефакт разрушен.',
      Markup.inlineKeyboard([Markup.button.callback('🍔Меню', 'menu')]),
    );
    await ctx.scene.leave();
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
    // await ctx.scene.enter(ScenesEnum.QUEST);
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply(
      'Поиск артефакта завершен.',
      Markup.inlineKeyboard([Markup.button.callback('🍔Меню', 'menu')]),
    );
  }
}
