import { Logger } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { AppService } from 'src/app.service';
import {
  GunInterface,
  NpcObj,
  PlayerDataDto,
} from 'src/common/player-data.dto';
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

  private readonly navigationKeyboard = [
    Markup.button.callback('⬆️50m', 'moveXXX' + '⬆️'),
    Markup.button.callback('⬅️50m', 'moveXXX' + '⬅️'),
    Markup.button.callback('⬇️50m', 'moveXXX' + '⬇️'),
    Markup.button.callback('➡️50m', 'moveXXX' + '➡️'),
  ];

  constructor(private readonly appService: AppService) {}

  calculateDamageForGun(gun: GunInterface, distance: number) {
    return Math.max(
      Math.floor(
        gun.base_damage -
          (((Math.abs(gun.optimal_distance - distance) / 15) *
            gun.optimal_modifier) /
            100) **
            2,
      ),
      0,
    );
  }

  calculateSpreadForGun(gun: GunInterface, distance: number) {
    return (
      100 -
      Math.max(
        Math.floor(
          gun.base_damage -
            (Math.abs(gun.optimal_distance - distance) / 30) ** 2,
        ),
        0,
      )
    );
  }

  calculateDistance(
    posOne: { x: number; y: number },
    posTwo: { x: number; y: number },
  ): number {
    const deltaX = posTwo.x - posOne.x;
    const deltaY = posTwo.y - posOne.y;
    return Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY)) + 1;
  }

  calculateSpreadByRounds(shotsPrev, distance) {
    if (distance > 2000) return 100;
    const spread = Math.floor(shotsPrev * distance ** 0.6);
    if (spread >= 100) return 100;
    return spread;
  }

  calculateDamage(distance: number, damage: number): number {
    const calcDamage = damage - (distance / 50) ** 2 + Math.random() * 5 - 5;
    if (calcDamage <= 0) return 0;
    return Math.floor(calcDamage);
  }

  formatCoord(coord: number): string {
    const coordLen = coord.toString().length;
    // const toLen = 5;
    // return '_'.repeat(toLen - coordLen) + coord.toString();
    return coord.toString();
  }

  moveEnemyByGun(player: NpcObj, enemy: NpcObj): NpcObj {
    const diffDistance = this.calculateDistance(
      enemy.position,
      player.position,
    );
    const posXDiff = enemy.position.x - player.position.x;
    const posYDiff = enemy.position.y - player.position.y;
    const posXPositive = Math.abs(posXDiff);
    const posYPositive = Math.abs(posYDiff);
    const moveXDist = posXPositive >= 20 ? 20 : posXPositive;
    const moveYDist = posYPositive >= 20 ? 20 : posYPositive;
    if (diffDistance > enemy.gun.optimal_distance) {
      enemy.position.x += posXDiff >= 0 ? -1 * moveXDist : moveXDist;
      enemy.position.y += posYDiff >= 0 ? -1 * moveYDist : moveYDist;
    } else {
      enemy.position.x += posXDiff >= 0 ? moveXDist : -1 * moveXDist;
      enemy.position.y += posYDiff >= 0 ? moveYDist : -1 * moveYDist;
    }
    return enemy;
  }

  @Action(/^attackXXX.*/gim)
  async attackEnemy(@Ctx() ctx: TelegrafContext) {
    // @ts-ignore
    const match = ctx.match[0];
    const enemyName: string = match.split('XXX')[1];
    const storePlayerData: PlayerDataDto =
      await this.appService.getStorePlayerData(ctx);
    let text = '';
    let battleData: PlayerDataDto = await this.appService.getBattle(ctx);
    const currentEnemy: NpcObj = battleData.battle.enemyList.filter(
      (item) => item.name === enemyName,
    )[0];
    const currentEnemyIndex: number = battleData.battle.enemyList.findIndex(
      (item) => item.name === enemyName,
    );
    if (!currentEnemy) ctx.scene.reenter();
    const distance: number = this.calculateDistance(
      battleData.battle.battlePlayer.position,
      currentEnemy.position,
    );
    const playerDamage: number = this.calculateDamageForGun(
      battleData.battle.battlePlayer.gun,
      distance,
    );
    const enemyDamage: number = this.calculateDamageForGun(
      currentEnemy.gun,
      distance,
    );
    const playerSpread: number = this.calculateSpreadForGun(
      battleData.battle.battlePlayer.gun,
      distance,
    );
    const enemySpread: number = this.calculateSpreadForGun(
      currentEnemy.gun,
      distance,
    );
    const isSuccessAttack: boolean = Math.random() * 100 > playerSpread;
    if (isSuccessAttack) {
      text += `Противник ${currentEnemy.name} получил ранения от '${battleData.battle.battlePlayer.gun.name}' ${playerDamage}hp на расстоянии ${distance}m.\n`;
      currentEnemy.health = currentEnemy.health - playerDamage;
      if (currentEnemy.health <= 0) {
        currentEnemy.isAlive = false;
        text += `${currentEnemy.name} более не опасен\n`;
      } else {
        text += `У ${currentEnemy.name} осталось ${currentEnemy.health}hp\n`;
      }
      battleData.battle.enemyList[currentEnemyIndex] = currentEnemy;
      ctx.scene.state[storePlayerData.player.telegram_id].enemyList =
        battleData.battle.enemyList;
    }
    if (!isSuccessAttack) {
      text += `Противник ${
        currentEnemy.name
      } находится на расстоянии ${distance}m. Шанс попадания ${
        100 - playerSpread
      }%.\n`;
      text += `Вы промахнулись по цели: ${currentEnemy.name}\n`;
    }
    const isSuccessCounterAttack: boolean = Math.random() * 100 > enemySpread;
    if (isSuccessCounterAttack) {
      text += `\nПротивник ${currentEnemy.name} выстрелил в вас в ответ из '${currentEnemy.gun.name}' ${enemyDamage}hp на расстоянии ${distance}m.\n`;
      battleData.battle.battlePlayer.health =
        battleData.battle.battlePlayer.health - enemyDamage;
      if (battleData.battle.battlePlayer.health <= 0) {
        battleData.battle.battlePlayer.isAlive = false;
        text += `Ущерб был летальным\n`;
      }
      if (battleData.battle.battlePlayer.health > 0) {
        text += `У вас осталось ${battleData.battle.battlePlayer.health}hp\n`;
      }
    }
    if (!isSuccessCounterAttack) {
      text += `Противник промахнулся\n`;
    }
    let keyboard = null;
    await this.appService.updateBattleEnemyList(
      ctx,
      battleData.battle.enemyList.filter((enemy) => enemy.isAlive),
    );
    battleData = await this.appService.getBattle(ctx);
    const allEnemyIsDead: boolean =
      battleData.battle.enemyList.filter((item) => item.isAlive).length === 0;
    if (allEnemyIsDead && battleData.battle.battlePlayer.health >= 0) {
      text += 'Все противники побеждены. Хорошая работа, сталкер';
      keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Вернуться', ScenesEnum.SCENE_QUEST),
      ]).reply_markup;
    }
    if (!allEnemyIsDead && battleData.battle.battlePlayer.health >= 0) {
      keyboard = Markup.inlineKeyboard(
        [
          ...this.navigationKeyboard,
          // кнопки для атаки конкретного персонажа
          ...battleData.battle.enemyList
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
    if (battleData.battle.battlePlayer.health <= 0) {
      text += 'Противники победили. Зона забрала вас';
      keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Вернуться', ScenesEnum.SCENE_QUEST),
      ]).reply_markup;
    }
    this.appService.updateDisplay(
      storePlayerData.playerProgress,
      keyboard,
      text,
      storePlayerData?.playerLocation?.image,
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
    let battleData = await this.appService.getBattle(ctx);
    let log = `Вы передвинулись ${direction} на 50m.\n\n`;
    await this.appService.updateBattleEnemyList(
      ctx,
      battleData.battle.enemyList,
    );
    if (direction === '⬆️')
      battleData.battle.battlePlayer.position.y =
        battleData.battle.battlePlayer.position.y + 50;
    if (direction === '⬇️')
      battleData.battle.battlePlayer.position.y =
        battleData.battle.battlePlayer.position.y - 50;
    if (direction === '⬅️')
      battleData.battle.battlePlayer.position.x =
        battleData.battle.battlePlayer.position.x - 50;
    if (direction === '➡️')
      battleData.battle.battlePlayer.position.x =
        battleData.battle.battlePlayer.position.x + 50;
    battleData.battle.battlePlayer = await this.appService.updateBattlePlayer(
      ctx,
      battleData.battle.battlePlayer,
    );
    // log += 'Ваши координаты:\n';
    // log += `↕️ ${this.formatCoord(
    //   battleData.battle.battlePlayer.position.y,
    // )}m, `;
    // log += `↔️ ${this.formatCoord(
    //   battleData.battle.battlePlayer.position.x,
    // )}m\n`;
    log += `У вас в руках ${battleData.battle.battlePlayer.gun.name}. Оптимальная дистанция, чтобы спустить курок ${battleData.battle.battlePlayer.gun.optimal_distance}m.\n`;
    await this.appService.updateBattleEnemyList(
      ctx,
      battleData.battle.enemyList.map((enemy) =>
        this.moveEnemyByGun(battleData.battle.battlePlayer, enemy),
      ),
    );
    battleData = await this.appService.getBattle(ctx);
    const enemyAway = battleData.battle.enemyList.filter((enemy) => {
      const dist = this.calculateDistance(
        battleData.battle.battlePlayer.position,
        enemy.position,
      );
      console.log('playerPos', battleData.battle.battlePlayer.position);
      console.log('enemy_Pos', enemy.position);
      console.log('distance:', dist);
      return dist <= 500;
    });
    if (enemyAway.length === 0) {
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Сбежать', 'leave'),
      ]).reply_markup;
      this.appService.updateDisplay(
        battleData.playerProgress,
        keyboard,
        'Вы ушли достаточно далеко',
        battleData?.playerLocation?.image,
      );
      // await ctx.scene.enter(ScenesEnum.SCENE_QUEST);
    }
    if (enemyAway.length !== 0) {
      const keyboard = Markup.inlineKeyboard(
        [
          ...this.navigationKeyboard,
          // кнопки для атаки конкретного персонажа
          ...battleData.battle.enemyList
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
      log +=
        this.getEnemiesPositions(
          battleData.battle.enemyList,
          battleData.battle.battlePlayer,
        ) + '\n';
      this.appService.updateDisplay(
        battleData.playerProgress,
        keyboard,
        log,
        'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
      );
    }
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegrafContext) {
    const playerData: PlayerDataDto = await this.appService.getStorePlayerData(
      ctx,
    );
    const battleData: PlayerDataDto = await this.appService.createBattle(ctx);
    const keyboard = Markup.inlineKeyboard(
      [
        ...this.navigationKeyboard,
        // кнопки для атаки конкретного персонажа
        ...battleData.battle.enemyList
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
    let log = `Вам на пути встретился противник - ${battleData.battle.enemyList[0].group}. Началась перестрелка. Чтобы сбежать отдалитесь на 500м. \n`;

    // log += 'Ваши координаты:\n';
    // log += `↕️ ${this.formatCoord(
    //   battleData.battle.battlePlayer.position.y,
    // )}m, `;
    // log += `↔️ ${this.formatCoord(
    //   battleData.battle.battlePlayer.position.x,
    // )}m\n`;
    log += `У вас в руках ${battleData.battle.battlePlayer.gun.name}. Оптимальная дистанция, чтобы спустить курок ${battleData.battle.battlePlayer.gun.optimal_distance}m.`;
    log += this.getEnemiesPositions(
      battleData.battle.enemyList,
      battleData.battle.battlePlayer,
    );
    this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      log,
      playerData?.playerLocation?.image,
    );
  }

  getEnemiesPositions(enemyList: NpcObj[], player): string {
    let text = '\n';
    let enemyPosText = '';
    for (let i = 0; i < enemyList.length; i++) {
      const enemy: NpcObj = enemyList[i];
      const distance = this.calculateDistance(player.position, enemy.position);
      const difX = enemy.position.x - player.position.x;
      const difY = enemy.position.y - player.position.y;
      const xSmile = difX == 0 ? '↔️' : difX < 0 ? '⬅️️' : '➡️';
      const ySmile = difY == 0 ? '↕️' : difY < 0 ? '⬇️' : '⬆️';
      enemyPosText += `\n${xSmile} ${this.formatCoord(Math.abs(difX))}m,`;
      enemyPosText += `  ${ySmile} ${this.formatCoord(Math.abs(difY))}m`;
      enemyPosText += ` - отдаление врага ${enemy.name}.\nОн находится на расстоянии 🏃 ${distance}m.\n`;
      enemyPosText += `В руках у него ${enemy.gun.name}.\nОптимальная дистанция его стрельбы ${enemy.gun.optimal_distance}m.\n`;
      text += enemyPosText;
      enemyPosText = '';
    }
    return text;
  }

  @Action('leave')
  async onLeaveCommand(@Ctx() ctx: TelegrafContext) {
    await ctx.scene.enter(ScenesEnum.SCENE_QUEST);
  }

  @Action(/^scene.*/gim)
  async enterBanditScene(@Ctx() ctx: Scenes.SceneContext) {
    // @ts-ignore
    const match = ctx.match[0];
    if (match) {
      const scene: ScenesEnum = match;
      await ctx.scene.enter(scene);
    }
  }
}
