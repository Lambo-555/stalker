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
import { QuestsEntity } from 'src/user/entities/quests.entity';
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

@Scene(ScenesEnum.QUEST)
export class QuestScene {
  private readonly logger = new Logger(QuestScene.name);

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
    @InjectRepository(RoadsEntity)
    private readonly roadsRepository: Repository<RoadsEntity>,
    @InjectRepository(QuestsEntity)
    private readonly questsEntity: Repository<QuestsEntity>,
  ) { }

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
    const telegram_id: number =
      ctx?.message?.from.id || ctx?.callbackQuery?.from?.id;
    const user: UsersEntity = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });
    const location: LocationsEntity = await this.locationsRepository.findOne({
      where: {
        id: user.location,
      },
    });
    const progress: ProgressEntity = await this.progressRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    const chapter: ChaptersEntity = await this.chaptersRepository.findOne({
      where: {
        id: progress.chapter_id,
      },
    });
    const quest: QuestsEntity = await this.questsEntity.findOne({
      where: {
        id: chapter.quest,
      },
    });
    const starterChapter = await this.chaptersRepository.findOne({
      order: { id: 1 },
      where: { content: Like('💭%') },
    });
    if (chapter.location === location.id) {
      await ctx.reply(
        `На этой локации есть с кем поговорить. ${chapter.character} вас ждет. Ваша текущая задача: ${quest.name}`,
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
    const user: UsersEntity = await this.usersRepository.findOne({
      where: { telegram_id: telegram_id },
    });

    let progress: ProgressEntity = await this.progressRepository.findOne({
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

    const nextChapter: ChaptersEntity = await this.chaptersRepository.findOne({
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
