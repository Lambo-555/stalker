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
import { RoadsEntity } from 'src/user/entities/roads.entity';
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

@Scene(ScenesEnum.QUEST)
export class QuestScene {
  private readonly logger = new Logger(QuestScene.name);

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
    @InjectRepository(RoadsEntity)
    private readonly roadsRepository: Repository<RoadsEntity>,
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
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: {
        id: user.location,
      },
    });
    const progress: Progress = await this.progressRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    const chapter: Chapters = await this.chaptersRepository.findOne({
      where: {
        id: progress.chapter_id,
      },
    });
    const starterChapter = await this.chaptersRepository.findOne({
      order: { id: 1 },
      where: { content: Like('💭%') },
    });
    if (chapter.location === location.id) {
      await ctx.reply(
        `На этой локации есть с кем поговорить. ${chapter.character} вас ждет.`,
        Markup.inlineKeyboard([
          Markup.button.callback('🤝Поговорить', 'chapterXXX' + chapter.id),
          Markup.button.callback('⚽️Сброс', 'chapterXXX' + starterChapter.id),
          Markup.button.callback('✋🏻Уйти', 'leave'),
        ]),
      );
    } else {
      await ctx.reply(
        `Здесь не с кем поговорить`,
        Markup.inlineKeyboard([Markup.button.callback('✋🏻Уйти', 'leave')], {
          columns: 1,
        }),
      );
    }
  }

  @Action(/chapterXXX.*/gim)
  async onChooseChapter(
    @Ctx() ctx: TelegrafContext,
    @Next() next: NextFunction,
  ) {
    const match = ctx.match[0];
    if (!match) next();
    console.log('match', match);
    const selectedChapterId = +match.split('XXX')[1]; // chapterXXX1
    console.log('choiseId', selectedChapterId);
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: Users = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });

    let progress: Progress = await this.progressRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    console.log('progress1', progress);
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: {
        id: user.location,
      },
    });
    await this.progressRepository.update(progress.progress_id, {
      chapter_id: selectedChapterId,
    });

    progress = await this.progressRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    console.log('progress2', progress);

    const nextChapter: Chapters = await this.chaptersRepository.findOne({
      where: { id: progress.chapter_id, location: location.id },
    });
    console.log('newChapter', nextChapter);

    if (!nextChapter) {
      await ctx.replyWithHTML(
        `<b>Более не с кем тут разговаривать</b>`,
        Markup.inlineKeyboard([Markup.button.callback('✋🏻Уйти', 'leave')]),
      );
    } else {
      const choises: Choices[] = await this.choicesRepository.find({
        where: { chapter_id: nextChapter.id },
      });
      console.log('choiseschoises', choises);

      choises.forEach(async (item) => {
        const chapter = await this.chaptersRepository.findOne({
          where: { id: item.chapter_id },
        });
        return {
          ...item,
          description: chapter.character,
        };
      });
      await ctx.replyWithHTML(
        `<b>${nextChapter.character}:</b> ${nextChapter.content}`,
        Markup.inlineKeyboard(
          [
            ...choises.map((item) =>
              Markup.button.callback(
                item?.description || 'neeext',
                'chapterXXX' + item.next_chapter_id.toString(),
              ),
            ),
            Markup.button.callback('✋🏻Уйти', 'leave'),
          ],
          {
            columns: 1,
          },
        ),
      );
    }
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
    // await ctx.scene.enter(ScenesEnum.QUEST);
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply(
      'Диалог завершен.',
      Markup.inlineKeyboard([Markup.button.callback('🍔Меню', 'menu')]),
    );
  }
}
