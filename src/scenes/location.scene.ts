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
import { Chapters } from 'src/user/entities/chapters.entity';
import { Choices } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { Progress } from 'src/user/entities/progress.entity';
import { Roads } from 'src/user/entities/roads.entity';
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

@Scene(ScenesEnum.LOCATION)
export class LocationScene {
  private readonly logger = new Logger(LocationScene.name);

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
    @InjectRepository(Artifacts)
    private readonly artifactsRepository: Repository<Artifacts>,
    @InjectRepository(Anomalies)
    private readonly anomaliesRepository: Repository<Anomalies>,
    @InjectRepository(LocationsEntity)
    private readonly locationsRepository: Repository<LocationsEntity>,
    @InjectRepository(Roads)
    private readonly roadsRepository: Repository<Roads>,
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
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: Users = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    const locations: LocationsEntity = await this.locationsRepository.findOne({
      where: { id: user.location },
    });
    const roads: Roads[] = await this.roadsRepository.find({
      where: { from: user.location },
    });
    const nextLocations: LocationsEntity[] = [];
    for await (const road of roads) {
      const locationsItem = await this.locationsRepository.findOne({
        where: { id: road.to },
      });
      nextLocations.push(locationsItem);
    }
    await ctx.reply(
      `Вы находитесь в локации: "${locations.name}". Куда вы хотите отправиться?`,
      Markup.inlineKeyboard(
        [
          Markup.button.callback('🍔Меню', 'menu'),
          Markup.button.callback('📍Остаться здесь', 'leave'),
          ...nextLocations.map((locationItem) =>
            Markup.button.callback(
              locationItem?.name,
              'locationsXXX' + locationItem.id.toString(),
            ),
          ),
        ],
        {
          columns: 1,
        },
      ),
    );
  }

  @Action(/locationsXXX.*/gim)
  async onChoose(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const match = ctx.match[0];
    if (!match) next();
    const locationId = +match.split('XXX')[1]; // locationsXXX
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: { id: locationId },
    });
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: Users = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    user.location = location.id || locationId;
    await this.usersRepository.update({ id: user.id }, user);
    await ctx.scene.leave();
    await ctx.reply(
      `Вы вошли в локацию: ${location.name}`,
      Markup.inlineKeyboard([Markup.button.callback('🍔Меню', 'menu')], {
        columns: 1,
      }),
    );
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
    // await ctx.scene.enter(ScenesEnum.QUEST);
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply('Перемещение завершено.');
  }
}