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

  buttlePart(enemyList) {
    const phrasesShot = [
      'Ай, мля',
      'Маслину поймал',
      'Епта',
      'Меня подбили, пацаны',
      'Погано то как',
      'Зацепило, пацаны',
    ];
    const phrasesMiss = [
      'Мозила',
      'Косой',
      'Баклан, ты мимо',
      'Ай, фаратнуло',
      'В молоко',
    ];
    let logs = '';
    let damageToEnemy = 0;
    let damageToPlayer = 0;
    while (enemyList.length !== 0) {
      const enemy = enemyList[0];
      const distancePlayers = this.calculateDistance(enemy, { x: 0, y: 0 });
      const spread = this.calculateSpread(1, distancePlayers);
      logs += `\nДистанция:${distancePlayers}. Разлетность: ${spread}%`;

      const phrasesIndex = Math.floor(Math.random() * phrasesShot.length);
      const phraseShot = phrasesShot[phrasesIndex];
      const phrasesMissIndex = Math.floor(Math.random() * phrasesMiss.length);
      const phraseMiss = phrasesMiss[phrasesMissIndex];

      const damageToEnemyNow = this.calculateDamage(distancePlayers, 120);
      const isShotToEnemy = Math.random() * 100 >= spread;
      if (isShotToEnemy) {
        logs += `\n${enemy.name}: ${phraseShot}\n`;
        damageToEnemy += damageToEnemyNow;
        logs += `Урон по врагу: ${damageToEnemyNow}\n`;
      } else {
        logs += `\n${enemy.name}: ${phraseMiss}\n`;
        logs += `Урон по врагу не прошел.\n`;
      }

      const damageToPlayerNow = this.calculateDamage(distancePlayers, 45);
      const isShotToPlayer = Math.random() * 100 >= spread;
      if (isShotToPlayer) {
        damageToPlayer += damageToPlayerNow;
        logs += `Ответный урон по вам: ${damageToPlayerNow}\n`;
      } else {
        logs += `Ответный урон по вам не прошел\n`;
      }

      if (damageToEnemy >= 75) {
        enemyList.splice(0, 1);
        logs += `${enemy.name} более не опасен...\n`;
        damageToEnemy = 0;
      }
      if (damageToPlayer >= 126) {
        enemyList.splice(0, 1);
        logs += `\nВы погибли...(На данном этапе это не влияет на прогресс)\n`;
        break;
      }
    }
    return logs;
  }

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
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('Вернуться', 'menu'),
    ]).reply_markup;
    const enemies: any[] = this.generateRandomEnemies();
    let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
      .map((item) => item.name)
      .join(', ')}.\n`;
    log += this.buttlePart(enemies);
    log += '\nБой окончен!';
    this.appService.updateDisplay(
      progress,
      keyboard,
      log,
      'https://sun9-40.userapi.com/impg/TdhFr4WwGgSQrY-68V5oP_iivWfv18ye2cs2UA/DQ5jU6dsKuM.jpg?size=1024x1024&quality=95&sign=314289bfceb91c4d013d1e4829d58d68&type=album',
    );
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
