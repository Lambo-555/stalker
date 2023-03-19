import { Logger } from '@nestjs/common';
import { NextFunction } from 'express';
import {
  Scene,
  SceneEnter,
  Ctx,
  Action,
  Next,
  InjectBot,
} from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import { PlayerDataDto } from 'src/common/player-data.dto';
import { ChaptersEntity } from 'src/database/entities/chapters.entity';
import { LocationsEntity } from 'src/database/entities/locations.entity';
import { RoadsEntity } from 'src/database/entities/roads.entity';
import { Markup, Scenes, Telegraf } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
import { ScenesEnum } from './enums/scenes.enum';

// ганг карс
// набираешь тиму, катаешься по району и отстреливаешь наркомафию
// цель игры - собрать тиму, оптимизировать пушки, нанимать норма водителя
// авто могут тормозить, маневрировать, гоняться на скорость
// можно посылать потрульные машины на рейды будучи дома
// сделать район богаче - новая миссия
// чем богаче и умнее район, тем больше примочек на автоматы

@Scene(ScenesEnum.SCENE_LOCATION)
export class LocationScene {
  private readonly logger = new Logger(LocationScene.name);

  constructor(
    @InjectBot() private bot: Telegraf<Scenes.SceneContext>,
    private readonly appService: AppService,
  ) {}

  /**
   * Показ текущей локации при переходе в сцену
   * Показ мест, куда можно пройти
   * @param ctx - контекст Telegram
   */
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    const roads: RoadsEntity[] = await this.appService.getRoadList(
      playerData.playerLocation.location,
    );
    const nextLocations: LocationsEntity[] = [];
    for await (const road of roads) {
      const locationsItem: LocationsEntity = await this.appService.getLocation(
        road.to,
      );
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
      playerData.playerProgress,
      null,
      `🏃 Перемещение...`,
      'https://sun9-23.userapi.com/impg/BerBvhk0PaC29WoXTFWTf49Fa-G_ktt1OXe7Ng/53JM42xkeeo.jpg?size=1920x855&quality=95&sign=1bc2fed9648961b2d332a7c6d42c8555&type=album',
    );
    await this.appService.sleep(Math.random() * 1500);
    await this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      `Вы находитесь в локации: "${playerData.playerLocation.location}". Куда вы хотите отправиться?`,
      playerData.playerLocation.image,
    );
  }

  @Action('alert')
  async onChox(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    ctx.reply('awdaw');
  }

  /**
   * Переход на локацию согласно ее названию
   * @param ctx - контекст Telegram
   * @param next - объект из express, позволяющий перейти далее по сцене
   * @returns
   */
  @Action(/locationsXXX.*/gim)
  async onChoose(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
    const match = ctx.match[0];
    if (!match) next();
    const locationCode: string = match.split('XXX')[1]; // locationsXXX
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    const location: LocationsEntity = await this.appService.getLocation(
      locationCode,
    );
    await ctx.answerCbQuery(
      `В дороге вам стало легче, ${playerData.player.will} + 10 воли.`,
      {
        show_alert: false,
        cache_time: 500,
      },
    );
    playerData.player.will += 10;
    ctx.scene.state[playerData.player.telegram_id] =
      await this.appService.updateStorePlayerLocation(ctx, {
        ...playerData.player,
        location: location.location,
      });
    const nextChapter = await this.appService.getChapterByCode(
      playerData.playerProgress.chapter_code,
    );
    const isBattle = this.chooseBattleByLocation(
      ctx,
      location.location,
      nextChapter,
    );
    if (isBattle) return isBattle;
    ctx.scene.reenter();
  }

  chooseBattleByLocation(ctx: TelegrafContext, location: string, nextChapter) {
    if (
      location.includes('(бандиты)') &&
      nextChapter?.character === 'Бандиты (враги)'
    ) {
      return ctx.scene.enter(ScenesEnum.SCENE_BATTLE);
    }
    if (location.includes('(бандиты)')) {
      return ctx.scene.enter(ScenesEnum.SCENE_BATTLE);
    }
    if (location.includes('(армия)')) {
      return ctx.scene.enter(ScenesEnum.SCENE_BATTLE);
    }
    if (location.includes('(монолит)')) {
      return ctx.scene.enter(ScenesEnum.SCENE_BATTLE);
    }
    if (location.includes('(зомби)')) {
      return ctx.scene.enter(ScenesEnum.SCENE_BATTLE);
    }
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: TelegrafContext) {
    await ctx.scene.leave();
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    const chapterNext: ChaptersEntity = await this.appService.getNextChapter(
      playerData,
    );
    const keyboard = Markup.inlineKeyboard(
      [
        Markup.button.callback('📍Перемещение', ScenesEnum.SCENE_LOCATION),
        // Markup.button.callback('☠️Бандиты', ScenesEnum.SCENE_BANDIT),
        Markup.button.callback('📟PDA', ScenesEnum.SCENE_PDA),
        Markup.button.callback(
          '☢️Взаимодействие',
          ScenesEnum.SCENE_QUEST,
          !!!chapterNext,
        ),
      ],
      {
        columns: 1,
      },
    ).reply_markup;
    this.appService.updateDisplay(
      playerData?.playerProgress,
      keyboard,
      this.appService.escapeText(
        `Вы на локации: ${playerData?.playerLocation?.location}.`,
      ),
      playerData?.playerLocation?.image,
    );
  }
}
