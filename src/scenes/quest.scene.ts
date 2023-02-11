import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction } from 'express';
import {
  Scene,
  SceneEnter,
  SceneLeave,
  Ctx,
  Action,
  Next,
  InjectBot,
} from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import { Anomalies } from 'src/user/entities/anomalies.entity';
import { Artifacts } from 'src/user/entities/artifacts.entity';
import { ChaptersEntity } from 'src/user/entities/chapters.entity';
import { ChoicesEntity } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { QuestsEntity } from 'src/user/entities/quests.entity';
import { RoadsEntity } from 'src/user/entities/roads.entity';
import { UsersEntity } from 'src/user/entities/users.entity';
import { Context, Markup, Scenes, Telegraf } from 'telegraf';
import { Repository } from 'typeorm';
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
    @InjectRepository(QuestsEntity)
    private readonly questsEntity: Repository<QuestsEntity>,
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    try {
      const telegram_id: number =
        ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
      const user: UsersEntity = await this.usersRepository.findOne({
        where: { telegram_id: telegram_id },
      });
      const location: LocationsEntity = await this.locationsRepository.findOne({
        where: {
          location: user.location,
        },
      });
      let progress: ProgressEntity = await this.progressRepository.findOne({
        where: {
          user_id: user.id,
        },
      });
      const chapter: ChaptersEntity = await this.chaptersRepository.findOne({
        where: {
          code: progress.chapter_code,
        },
      });
      if (!progress?.chat_id || !progress?.message_display_id) {
        const imgLink = this.appService.escapeText('https://clck.ru/33PBvE');
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu'),
        ]).reply_markup;
        const messageDisplay = await ctx.replyWithPhoto(imgLink, {
          caption: 'Display',
          // @ts-ignore
          has_spoiler: true,
          // parse_mode: 'Markdown2',
          //@ts-ignore
          reply_markup: keyboard,
        });
        await this.progressRepository.update(progress?.progress_id, {
          chat_id: messageDisplay.chat.id,
          message_display_id: messageDisplay.message_id,
        });
        progress = await this.progressRepository.findOne({
          where: { user_id: user?.id },
        });
      }
      if (chapter.location === location.location) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('🤝Диалог', 'chapterXXX' + chapter.code),
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]).reply_markup;
        await this.appService.updateDisplay(
          progress,
          keyboard,
          `${chapter?.character}`, 
          location.image,
        );
      } else {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]).reply_markup;
        await this.appService.updateDisplay(
          progress,
          keyboard,
          `Здесь не с кем взаимодействовать`,
          // location.image,
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
      const selectedChapterCode: string = match.split('XXX')[1]; // chapterXXX1
      const telegram_id: number =
        ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
      const user: UsersEntity = await this.usersRepository.findOne({
        where: { telegram_id: telegram_id },
      });
      let progress: ProgressEntity = await this.progressRepository.findOne({
        where: {
          user_id: user.id,
        },
      });
      const location: LocationsEntity = await this.locationsRepository.findOne({
        where: {
          location: user.location,
        },
      });
      await this.progressRepository.update(progress.progress_id, {
        chapter_code: selectedChapterCode,
      });
      progress = await this.progressRepository.findOne({
        where: {
          user_id: user.id,
        },
      });
      const nextChapter: ChaptersEntity = await this.chaptersRepository.findOne(
        {
          where: { code: progress.chapter_code, location: location.location },
        },
      );
      if (!progress?.chat_id || !progress?.message_display_id) {
        const imgLink = this.appService.escapeText('https://clck.ru/33PBvE');
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu'),
        ]).reply_markup;
        const messageDisplay = await ctx.replyWithPhoto(imgLink, {
          caption: 'Display',
          // @ts-ignore
          has_spoiler: true,
          // parse_mode: 'Markdown2',
          //@ts-ignore
          reply_markup: keyboard,
        });
        await this.progressRepository.update(progress?.progress_id, {
          chat_id: messageDisplay.chat.id,
          message_display_id: messageDisplay.message_id,
        });
        progress = await this.progressRepository.findOne({
          where: { user_id: user?.id },
        });
      }
      if (!nextChapter) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]).reply_markup;
        await this.appService.updateDisplay(
          progress,
          keyboard,
          `Здесь не с кем взаимодействовать`,
        );
      } else {
        const choices: ChoicesEntity[] = await this.choicesRepository.find({
          where: { code: nextChapter.code },
        });
        choices.forEach(async (item) => {
          const chapter = await this.chaptersRepository.findOne({
            where: { code: item.next_code },
          });
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
            // Markup.button.callback('✋🏻Уйти', 'leave'),
            // Markup.button.callback('Откат', 'back'),
          ],
          {
            columns: 1,
          },
        ).reply_markup;

        await this.appService.updateDisplay(
          progress,
          keyboard,
          `${nextChapter?.character}: ` + nextChapter.content,
          nextChapter?.image || location?.image,
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  @Action('back')
  async onBack(@Ctx() ctx: TelegrafContext) {
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
    const choiceBack: ChoicesEntity = await this.choicesRepository.findOne({
      where: {
        next_code: progress.chapter_code,
      },
    });
    await this.progressRepository.update(progress, {
      chapter_code: choiceBack.code,
    });
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    try {
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
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu'),
      ]).reply_markup;
      const location: LocationsEntity = await this.locationsRepository.findOne({
        where: { location: user.location },
      });
      await this.appService.updateDisplay(
        progress,
        keyboard,
        `Диалог завершен...`,
        location?.image,
      );
    } catch (error) {
      console.error(error);
    }
  }
}
