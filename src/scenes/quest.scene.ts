import { Logger } from '@nestjs/common';
import { NextFunction } from 'express';
import {
  Scene,
  SceneEnter,
  SceneLeave,
  Ctx,
  Action,
  Next,
} from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import { PlayerDataDto } from 'src/common/player-data.dto';
import { ChaptersEntity } from 'src/user/entities/chapters.entity';
import { ChoicesEntity } from 'src/user/entities/choices.entity';
import { Markup } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
import { ScenesEnum } from './enums/scenes.enum';

// ганг карс
// набираешь тиму, катаешься по району и отстреливаешь наркомафию
// цель игры - собрать тиму, оптимизировать пушки, нанимать норма водителя
// авто могут тормозить, маневрировать, гоняться на скорость
// можно посылать потрульные машины на рейды будучи дома
// сделать район богаче - новая миссия
// чем богаче и умнее район, тем больше примочек на автоматы

@Scene(ScenesEnum.SCENE_QUEST)
export class QuestScene {
  private readonly logger = new Logger(QuestScene.name);

  constructor(private readonly appService: AppService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    try {
      const playerData: PlayerDataDto =
        await this.appService.getStorePlayerData(ctx);
      const chapter: ChaptersEntity = await this.appService.getNextChapter(
        playerData,
      );
      if (chapter.location === playerData.playerLocation.location) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('🤝Диалог', 'chapterXXX' + chapter.code),
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]).reply_markup;
        await this.appService.updateDisplay(
          playerData.playerProgress,
          keyboard,
          `${chapter?.character}`,
          playerData.playerLocation.image,
        );
      } else {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]).reply_markup;
        await this.appService.updateDisplay(
          playerData.playerProgress,
          keyboard,
          `Здесь не с кем взаимодействовать`,
          playerData.playerLocation.image,
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  @Action(/chapterXXX.*/gim)
  async onChooseChapter(
    @Ctx() ctx: TelegrafContext,
    @Next() next: NextFunction,
  ) {
    try {
      const match = ctx.match[0];
      if (!match) next();
      const selectedChapterCode: string = match.split('XXX')[1];
      let playerData: PlayerDataDto = await this.appService.getStorePlayerData(
        ctx,
      );
      ctx.scene.state[playerData.player.telegram_id] =
        await this.appService.updateStorePlayerProgress(ctx, {
          ...playerData.playerProgress,
          chapter_code: selectedChapterCode,
        });
      playerData = await this.appService.getStorePlayerData(ctx);
      const nextChapter: ChaptersEntity = await this.appService.getNextChapter(
        playerData,
      );
      if (!nextChapter) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]).reply_markup;
        await this.appService.updateDisplay(
          playerData.playerProgress,
          keyboard,
          `Здесь не с кем взаимодействовать`,
          playerData.playerLocation.image,
        );
      } else {
        const choices: ChoicesEntity[] = await this.appService.getChoiceList(
          nextChapter.code,
        );
        choices.forEach(async (item) => {
          const chapter: ChaptersEntity =
            await this.appService.getChapterByCode(item.next_code);
          return {
            ...item,
            description: chapter.character,
          };
        });
        const keyboard = Markup.inlineKeyboard(
          [
            ...choices.map((item) =>
              Markup.button.callback(
                this.appService.escapeText(item?.description),
                'chapterXXX' + item.next_code.toString(),
              ),
            ),
          ],
          {
            columns: 1,
          },
        ).reply_markup;
        await this.appService.updateDisplay(
          playerData.playerProgress,
          keyboard,
          `${nextChapter?.character}: ` + nextChapter.content,
          playerData.playerLocation.image,
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: TelegrafContext) {
    await ctx.scene.leave();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: TelegrafContext) {
    try {
      await ctx.scene.leave();
      const playerData: PlayerDataDto =
        await this.appService.getStorePlayerData(ctx);
      const chapterNext: ChaptersEntity = await this.appService.getNextChapter(
        playerData,
      );
      const keyboard = Markup.inlineKeyboard(
        [
          Markup.button.callback('📍Перемещение', ScenesEnum.SCENE_LOCATION),
          Markup.button.callback('☠️Бандиты', ScenesEnum.SCENE_BANDIT),
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
    } catch (error) {
      console.error(error);
    }
  }
}
