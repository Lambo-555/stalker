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
import { ChoicesEntity } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { RoadsEntity } from 'src/user/entities/roads.entity';
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

@Scene(ScenesEnum.LOCATION)
export class LocationScene {
  private readonly logger = new Logger(LocationScene.name);

  constructor(
    private readonly appService: AppService,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(ChaptersEntity)
    private readonly chaptersRepository: Repository<ChaptersEntity>,
    @InjectRepository(ChoicesEntity)
    private readonly choicesRepository: Repository<ChoicesEntity>,
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
    @InjectRepository(RoadsEntity)
    private readonly roadsRepository: Repository<RoadsEntity>,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: UsersEntity = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    const progress: ProgressEntity = await this.progressRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: { location: user.location },
    });
    const roads: RoadsEntity[] = await this.roadsRepository.find({
      where: { from: user.location },
    });
    const nextLocations: LocationsEntity[] = [];
    for await (const road of roads) {
      const locationsItem = await this.locationsRepository.findOne({
        where: { location: road.to },
      });
      nextLocations.push(locationsItem);
    }
    const keyboard = Markup.inlineKeyboard(
      [
        ...nextLocations.map((locationItem) =>
          Markup.button.callback(
            locationItem?.location,
            'locationsXXX' + locationItem.location.toString(),
          ),
        ),
        Markup.button.callback('📍Остаться здесь', 'leave'),
      ],
      {
        columns: 1,
      },
    ).reply_markup;
    await this.appService.updateDisplay(
      progress,
      keyboard,
      `Вы находитесь в локации: "${location.location}". Куда вы хотите отправиться?`,
      location.image,
    );
  }

  @Action(/locationsXXX.*/gim)
  async onChoose(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const match = ctx.match[0];
    if (!match) next();
    const locationCode: string = match.split('XXX')[1]; // locationsXXX
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: { location: locationCode },
    });
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: UsersEntity = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    await this.usersRepository.update(
      { id: user.id },
      { location: location.location || locationCode },
    );
    await ctx.scene.reenter();
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: UsersEntity = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    const progress: ProgressEntity = await this.progressRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: { location: user.location },
    });
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'menu'),
    ]).reply_markup;
    await this.appService.updateDisplay(
      progress,
      keyboard,
      `Перемещение завершено`,
      location?.image,
    );
  }
}
