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

@Scene(ScenesEnum.BANDIT)
export class BanditScene {
  private readonly logger = new Logger(BanditScene.name);

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

  calculateDistance(
    posOne: { x: number; y: number },
    posTwo: { x: number; y: number },
  ): number {
    const deltaX = posTwo.x - posOne.x;
    const deltaY = posTwo.y - posOne.y;
    return Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY)) + 1;
  }

  calculateSpread(shotsPrev, distance) {
    if (distance > 2000) return 100;
    const spread = Math.floor(shotsPrev * distance ** 0.6);
    if (spread >= 100) return 100;
    return spread;
  }

  generatePlayerPosition(): { x: number; y: number } {
    const x = Math.floor(Math.random() * 1000);
    const y = Math.floor(Math.random() * 1000);
    return { x, y };
  }

  calculateDamage(distance: number, damage: number): number {
    const calcDamage = damage - (distance / 50) ** 2 + Math.random() * 5 - 5;
    if (calcDamage <= 0) return 0;
    return Math.floor(calcDamage);
  }

  generateRandomEnemies(): { x: number; y: number; name: string }[] {
    const names = [
      'Васян',
      'Жора',
      'Борян',
      'Колян',
      'Стасик',
      'Петрос',
      'Роберт',
      'Андрюха',
      'Асти',
      'Максон',
      'Максан',
      'Денчик',
      'Витян',
    ];
    const surNames = [
      'Бобр',
      'Жесткий',
      'Кривой',
      'Зануда',
      'Мозила',
      'Пес',
      'Гангстер',
      'Черный',
      'Дикий',
      'Цепной',
      'Шальной',
      'Зеленый',
      'Маслинник',
    ];
    const enemies: { x: number; y: number; name: string }[] = [];
    // const playersCount = Math.floor(Math.random() * 5) + 1;
    const enemiesTargetCount = Math.floor(Math.random() * 2) + 1;
    while (enemies?.length !== enemiesTargetCount) {
      const x = Math.floor(Math.random() * 200);
      const y = Math.floor(Math.random() * 200);
      const nameIndex = Math.floor(Math.random() * names?.length);
      const name = names[nameIndex];
      names.splice(nameIndex, 1);
      const surNameIndex = Math.floor(Math.random() * names?.length);
      const surName = surNames[surNameIndex];
      surNames.splice(surNameIndex, 1);
      const pogonalo = `${name} ${surName}`;
      enemies.push({ x, y, name: pogonalo });
    }
    return enemies;
  }

  buttlePart(enemyList?) {
    let logs = '';
    enemyList.forEach((enemyPos, index) => {
      logs += `Враг: ${enemyPos.name}\n`;
      const playerPos = { x: 0, y: 0 };
      const distance = this.calculateDistance(enemyPos, playerPos);
      const shoots = 3;
      logs += `Вы стреляете очередью по ${shoots} выстрелов.\n`;
      logs += 'Расстояние: ' + distance;
      let totalDamage = 0;
      for (let shootIndex = 1; shootIndex <= shoots; shootIndex++) {
        if (totalDamage >= 100) {
          logs += '\nВраг ' + enemyPos.name + ' убит.';
          enemyList.splice(index, 1);
          break;
        }
        logs += '\nВыстрел' + shootIndex + ': ';
        const spread = this.calculateSpread(shootIndex, distance);
        const damage = this.calculateDamage(distance, 120);
        const chanceToShoot = 100 - spread;
        const shootIsOk = 100 * Math.random() <= chanceToShoot;
        if (shootIsOk) totalDamage += damage;
        logs += 'Разброс: ' + spread + '%.  ';
        logs += 'Урон: ' + damage + 'хп. ';
        logs += 'Пападание: ' + (shootIsOk ? 'Есть!' : 'Мимо!');
      }
      logs += '\nИтоговый урон: ' + totalDamage + '\n\n';
      totalDamage = 0;
    });
    return { logs, enemyList };
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    let enemies: any[] = this.generateRandomEnemies();
    let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
      .map((item) => item.name)
      .join(', ')}.\n`;
    let battle = null;
    while (enemies.length !== 0) {
      battle = this.buttlePart(enemies);
      if (battle?.enemyList?.length >= 1) {
        enemies = battle?.enemyList;
      }
      log += battle.logs;
    }
    const message = await ctx.reply(log + '\nБой окончен!');
    try {
      setTimeout(() => {
        this.bot.telegram.deleteMessage(message.chat.id, message.message_id);
      }, 25000);
    } catch (error) {
      console.log(error);
    }
    ctx.scene.leave();
  }

  // переговоры бандитов - заходи, сбоку заходи
  // инфо о позиции бандитов:
  /**
   * 1 бандит спереди-слева за насыпью
   * 2 бандита не видно
   * я за насыпью, правый бок открыт, левый бок открыт, дистрация 25 метров
   */
  // действия - сменить позицию, уйти дальше, укрытия нет
  // действия - сменить позицию, атака 1 бандита
  // действия - сменить позицию, атака 1 бандита
  // }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.leave();
    // await ctx.scene.enter(ScenesEnum.QUEST);
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    //
  }
}
