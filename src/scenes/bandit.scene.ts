import { Logger } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import { EnemyObj, PlayerDataDto } from 'src/common/player-data.dto';
import { Markup, Scenes } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
import { ScenesEnum } from './enums/scenes.enum';

// ганг карс
// набираешь тиму, катаешься по району и отстреливаешь наркомафию
// цель игры - собрать тиму, оптимизировать пушки, нанимать норма водителя
// авто могут тормозить, маневрировать, гоняться на скорость
// можно посылать потрульные машины на рейды будучи дома
// сделать район богаче - новая миссия
// чем богаче и умнее район, тем больше примочек на автоматы

@Scene(ScenesEnum.SCENE_BANDIT)
export class BanditScene {
  private readonly logger = new Logger(BanditScene.name);

  constructor(private readonly appService: AppService) {}

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

  generateRandomEnemies(): EnemyObj[] {
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
    const enemies: EnemyObj[] = [];
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
      const pogonyalo = `${name} ${surName}`;
      enemies.push({
        position: { x, y },
        name: pogonyalo,
        isAlive: true,
        health: 75,
        group: 'Бандиты',
      });
    }
    return enemies;
  }

  @Action(/^attackXXX.*/gim)
  async attackEnemy(@Ctx() ctx: TelegrafContext) {
    // @ts-ignore
    const match = ctx.match[0];
    const enemyName: string = match.split('XXX')[1];
    const storeData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    let text = '';
    const enemyList: EnemyObj[] = storeData.enemyList;
    const currentEnemy: EnemyObj = enemyList.filter(
      (item) => item.name === enemyName,
    )[0];
    const currentEnemyIndex: number = enemyList.findIndex(
      (item) => item.name === enemyName,
    );
    if (!currentEnemy) ctx.scene.reenter();
    const player: EnemyObj = {
      position: { x: 50, y: 50 },
      name: 'Player',
      health: 150,
      isAlive: true,
    };
    const distance: number = this.calculateDistance(
      player.position,
      currentEnemy.position,
    );
    const damage: number = this.calculateDamage(distance, 50);
    const spread: number = this.calculateSpread(1, distance);
    console.log('spreadspread', spread);
    const isSuccessAttack: boolean = Math.random() * 100 > spread;
    console.log('isSuccessAttackisSuccessAttack', isSuccessAttack);
    if (isSuccessAttack) {
      text += `Противник ${currentEnemy.name} получил ранения ${damage}hp на расстоянии ${distance}m.\n`;
      currentEnemy.health = currentEnemy.health - damage;
      if (currentEnemy.health <= 0) {
        currentEnemy.isAlive = false;
        text += `${currentEnemy.name} более не опасен\n`;
      } else {
        text += `У ${currentEnemy.name} осталось ${currentEnemy.health}hp\n`;
      }
      enemyList[currentEnemyIndex] = currentEnemy;
      ctx.scene.state[playerData.player.telegram_id].enemyList = enemyList;
    }
    if (!isSuccessAttack) {
      text += `Противник ${
        currentEnemy.name
      } находится на расстоянии ${distance}m. Шанс попадания ${
        100 - spread
      }%.\n`;
      text += `Вы промахнулись по цели: ${currentEnemy.name}\n`;
    }
    let keyboard = null;
    if (!enemyList.filter((enemy) => enemy.isAlive).length) {
      text += 'Все противники побеждены. Хорошая работа, сталкер';
      keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Вернуться', ScenesEnum.SCENE_QUEST),
      ]).reply_markup;
    } else {
      keyboard = Markup.inlineKeyboard(
        [
          // Markup.button.callback('Вернуться', 'menu'),
          Markup.button.callback('⬆️50m', 'goBack'),
          Markup.button.callback('⬅️50m', 'goLeft'),
          Markup.button.callback('⬇️50m', 'goForward'),
          Markup.button.callback('➡️50m', 'goRight'),
          // кнопки для атаки конкретного персонажа
          ...ctx.scene.state[playerData.player.telegram_id].enemyList
            .filter((enemy) => enemy.isAlive)
            .map((enemyItem) =>
              Markup.button.callback(
                '🎯' + enemyItem.name,
                'attackXXX' + enemyItem.name,
              ),
            ),
        ],
        {
          columns: 2,
        },
      ).reply_markup;
    }
    this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      text,
      'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
    );
  }

  @Action(/^moveXXX.*/gim)
  async onMove(@Ctx() ctx: TelegrafContext) {
    // @ts-ignore
    const match = ctx.match[0];
    const direction: string = match.split('XXX')[1];
    if (!direction) {
      await ctx.scene.enter(ScenesEnum.SCENE_QUEST);
    }
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    let log = `Вы передвинулись ${direction} на 50m. Расстояние до противника поменялось.\n\n`;
    let enemyList: EnemyObj[] = null;
    if (!ctx.scene.state[playerData.player.telegram_id]?.enemyList?.length) {
      enemyList = this.generateRandomEnemies();
    } else {
      enemyList = ctx.scene.state[playerData.player.telegram_id]?.enemyList;
    }
    enemyList = enemyList.filter((enemy) => enemy.isAlive);
    ctx.scene.state[playerData.player.telegram_id] = {
      ...playerData,
      enemyList,
    };
    log += 'Было:' + this.getEnemiesPositions(enemyList) + '\n';
    if (direction === '⬆️') {
      enemyList.map((item) => {
        item.position.y = item.position.y - 50;
        return item;
      });
    }
    if (direction === '⬇️') {
      enemyList.map((item) => {
        item.position.y = item.position.y + 50;
        return item;
      });
    }
    if (direction === '⬅️') {
      enemyList.map((item) => {
        item.position.x = item.position.x + 50;
        return item;
      });
    }
    if (direction === '➡️') {
      enemyList.map((item) => {
        item.position.x = item.position.x - 50;
        return item;
      });
    }
    ctx.scene.state[playerData.player.telegram_id].enemyList = enemyList;
    const keyboard = Markup.inlineKeyboard(
      [
        // Markup.button.callback('Вернуться', 'menu'),
        Markup.button.callback('⬆️50m', 'moveXXX' + '⬆️'),
        Markup.button.callback('⬅️50m', 'moveXXX' + '⬅️'),
        Markup.button.callback('⬇️50m', 'moveXXX' + '⬇️'),
        Markup.button.callback('➡️50m', 'moveXXX' + '➡️'),
        // кнопки для атаки конкретного персонажа
        ...ctx.scene.state[playerData.player.telegram_id].enemyList
          .filter((enemy) => enemy.isAlive)
          .map((enemyItem) =>
            Markup.button.callback(
              '🎯' + enemyItem.name,
              'attackXXX' + enemyItem.name,
            ),
          ),
      ],
      {
        columns: 2,
      },
    ).reply_markup;
    log += 'Стало:' + this.getEnemiesPositions(enemyList) + '\n';
    this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      log,
      'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
    );
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    let enemyList: EnemyObj[] = null;
    if (!ctx.scene.state[playerData.player.telegram_id]?.enemyList?.length) {
      enemyList = this.generateRandomEnemies();
    } else {
      enemyList = ctx.scene.state[playerData.player.telegram_id]?.enemyList;
    }
    ctx.scene.state[playerData.player.telegram_id] = {
      ...playerData,
      enemyList,
    };
    console.log('awdawdaw', ctx.scene.state[playerData.player.telegram_id]);
    const keyboard = Markup.inlineKeyboard(
      [
        // Markup.button.callback('Вернуться', 'menu'),
        Markup.button.callback('⬆️50m', 'moveXXX' + '⬆️'),
        Markup.button.callback('⬅️50m', 'moveXXX' + '⬅️'),
        Markup.button.callback('⬇️50m', 'moveXXX' + '⬇️'),
        Markup.button.callback('➡️50m', 'moveXXX' + '➡️'),
        // кнопки для атаки конкретного персонажа
        ...ctx.scene.state[playerData.player.telegram_id].enemyList
          .filter((enemy) => enemy.isAlive)
          .map((enemyItem) =>
            Markup.button.callback(
              '🎯' + enemyItem.name,
              'attackXXX' + enemyItem.name,
            ),
          ),
      ],
      {
        columns: 2,
      },
    ).reply_markup;
    let log = `Вам на пути встретились бандиты. Началась перестрелка.\n`;
    log += this.getEnemiesPositions(enemyList);

    this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      log,
      'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
    );
  }

  getEnemiesPositions(enemyList: EnemyObj[]): string {
    let text = '\n';
    let enemyPosText = '';
    const player: EnemyObj = {
      position: { x: 50, y: 50 },
      name: 'Player',
      health: 150,
      isAlive: true,
    };
    for (let i = 0; i < enemyList.length; i++) {
      const enemy: EnemyObj = enemyList[i];
      const distance = this.calculateDistance(player.position, enemy.position);
      enemyPosText += `${enemy.name} находится ${
        player.position.y > enemy.position.y ? 'позади' : 'спереди'
      } ${
        player.position.x > enemy.position.x ? 'слева' : 'справа'
      } на расстоянии ${distance}. `;
      enemyPosText += `Шанс попадания: ${
        80 - this.calculateSpread(1, distance)
      }%. Можно нанести урона: ${this.calculateDamage(distance, 50)}\n\n`;
      text += enemyPosText;
      enemyPosText = '';
    }
    return text;
  }

  // ORIGINAL
  // @SceneEnter()
  // async onSceneEnter(@Ctx() ctx: TelegrafContext) {
  //   const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
  //     ctx,
  //   );
  //   const keyboard = Markup.inlineKeyboard([
  //     // Markup.button.callback('Вернуться', 'menu'),
  //     Markup.button.callback('Вернуться', ScenesEnum.SCENE_QUEST),
  //   ]).reply_markup;
  //   const enemies: any[] = this.generateRandomEnemies();
  //   let log = `Вам на пути встретились бандиты. Началась перестрелка. Вы обнаружили врагов: ${enemies
  //     .map((item) => item.name)
  //     .join(', ')}.\n`;
  //   log += this.battlePart(enemies);
  //   log += '\nБой окончен!';
  //   this.appService.updateDisplay(
  //     playerData.playerProgress,
  //     keyboard,
  //     log,
  //     'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
  //   );
  //   // ctx.scene.leave();
  // }

  // battlePart(enemyList) {
  //   const phrasesShot = [
  //     'Ай, мля',
  //     'Маслину поймал',
  //     'Епта',
  //     'Меня подбили, пацаны',
  //     'Погано то как',
  //     'Зацепило, пацаны',
  //   ];
  //   const phrasesMiss = [
  //     'Мозила',
  //     'Косой',
  //     'Баклан, ты мимо',
  //     'Ай, фаратнуло',
  //     'В молоко',
  //   ];
  //   let logs = '';
  //   let damageToEnemy = 0;
  //   let damageToPlayer = 0;
  //   while (enemyList.length !== 0) {
  //     const enemy = enemyList[0];
  //     const distancePlayers = this.calculateDistance(enemy, { x: 0, y: 0 });
  //     const spread = this.calculateSpread(1, distancePlayers);
  //     logs += `\nДистанция:${distancePlayers}. Разлетность: ${spread}%`;
  //     const phrasesIndex = Math.floor(Math.random() * phrasesShot.length);
  //     const phraseShot = phrasesShot[phrasesIndex];
  //     const phrasesMissIndex = Math.floor(Math.random() * phrasesMiss.length);
  //     const phraseMiss = phrasesMiss[phrasesMissIndex];
  //     const damageToEnemyNow = this.calculateDamage(distancePlayers, 120);
  //     const isShotToEnemy = Math.random() * 100 >= spread;
  //     if (isShotToEnemy) {
  //       logs += `\n${enemy.name}: ${phraseShot}\n`;
  //       damageToEnemy += damageToEnemyNow;
  //       logs += `Урон по врагу: ${damageToEnemyNow}\n`;
  //     } else {
  //       logs += `\n${enemy.name}: ${phraseMiss}\n`;
  //       logs += `Урон по врагу не прошел.\n`;
  //     }
  //     const damageToPlayerNow = this.calculateDamage(distancePlayers, 45);
  //     const isShotToPlayer = Math.random() * 100 >= spread;
  //     if (isShotToPlayer) {
  //       damageToPlayer += damageToPlayerNow;
  //       logs += `Ответный урон по вам: ${damageToPlayerNow}\n`;
  //     } else {
  //       logs += `Ответный урон по вам не прошел\n`;
  //     }
  //     if (damageToEnemy >= 75) {
  //       enemyList.splice(0, 1);
  //       logs += `${enemy.name} более не опасен...\n`;
  //       damageToEnemy = 0;
  //     }
  //     if (damageToPlayer >= 126) {
  //       enemyList.splice(0, 1);
  //       logs += `\nВы погибли...(На данном этапе это не влияет на прогресс)\n`;
  //       break;
  //     }
  //   }
  //   return logs;
  // }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: TelegrafContext) {
    await ctx.scene.enter(ScenesEnum.SCENE_LOCATION);
  }

  @Action(/^scene.*/gim)
  async enterBanditScene(@Ctx() ctx: Scenes.SceneContext) {
    // @ts-ignore
    const match = ctx.match[0];
    if (match) {
      const scene: ScenesEnum = match;
      await ctx.scene.enter(scene);
    }
    return;
  }
}
