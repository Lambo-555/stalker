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
        gun.baseDamage - (Math.abs(gun.optimalDistance - distance) / 15) ** 2,
      ),
      0,
    );
  }

  calculateSpreadForGun(gun: GunInterface, distance: number) {
    return (
      100 -
      Math.max(
        Math.floor(
          gun.baseDamage - (Math.abs(gun.optimalDistance - distance) / 30) ** 2,
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

  calculateSpread(shotsPrev, distance) {
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
    const toLen = 5;
    return '_'.repeat(toLen - coordLen) + coord.toString();
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
    if (diffDistance > enemy.gun.optimalDistance) {
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
    const enemyList: NpcObj[] = await this.appService.getBattleEnemyList(ctx);
    const currentEnemy: NpcObj = enemyList.filter(
      (item) => item.name === enemyName,
    )[0];
    const currentEnemyIndex: number = enemyList.findIndex(
      (item) => item.name === enemyName,
    );
    if (!currentEnemy) ctx.scene.reenter();
    const battlePlayer: NpcObj = await this.appService.getBattlePlayer(ctx);
    if (!battlePlayer) console.error('NO PLAYER HERE');
    const distance: number = this.calculateDistance(
      battlePlayer.position,
      currentEnemy.position,
    );
    const damage: number = this.calculateDamageForGun(
      battlePlayer.gun,
      distance,
    );
    const spread: number = this.calculateSpreadForGun(
      battlePlayer.gun,
      distance,
    );
    const isSuccessAttack: boolean = Math.random() * 100 > spread;
    if (isSuccessAttack) {
      text += `Противник ${currentEnemy.name} получил ранения от '${battlePlayer.gun.name}' ${damage}hp на расстоянии ${distance}m.\n`;
      currentEnemy.health = currentEnemy.health - damage;
      if (currentEnemy.health <= 0) {
        currentEnemy.isAlive = false;
        text += `${currentEnemy.name} более не опасен\n`;
      } else {
        text += `У ${currentEnemy.name} осталось ${currentEnemy.health}hp\n`;
      }
      enemyList[currentEnemyIndex] = currentEnemy;
      ctx.scene.state[storePlayerData.player.telegram_id].enemyList = enemyList;
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
    ctx.scene.state[storePlayerData.player.telegram_id].enemyList =
      enemyList.filter((enemy) => enemy.isAlive);
    const allEnemyIsDead =
      !!ctx.scene.state[storePlayerData.player.telegram_id].enemyList.length;
    if (allEnemyIsDead && battlePlayer.health >= 0) {
      text += 'Все противники побеждены. Хорошая работа, сталкер';
      keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Вернуться', ScenesEnum.SCENE_QUEST),
      ]).reply_markup;
    }
    if (!allEnemyIsDead && battlePlayer.health >= 0) {
      keyboard = Markup.inlineKeyboard(
        [
          // Markup.button.callback('Вернуться', 'menu'),
          Markup.button.callback('⬆️50m', 'goBack'),
          Markup.button.callback('⬅️50m', 'goLeft'),
          Markup.button.callback('⬇️50m', 'goForward'),
          Markup.button.callback('➡️50m', 'goRight'),
          // кнопки для атаки конкретного персонажа
          ...ctx.scene.state[storePlayerData.player.telegram_id].enemyList
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
    if (battlePlayer.health <= 0) {
      text += 'Противники победили. Зона забрала вас';
      keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Вернуться', ScenesEnum.SCENE_QUEST),
      ]).reply_markup;
    }
    this.appService.updateDisplay(
      storePlayerData.playerProgress,
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
    log += `[➡️: ${this.formatCoord(
      battleData.battle.battlePlayer.position.x,
    )}, ⬆️: ${this.formatCoord(
      battleData.battle.battlePlayer.position.y,
    )}] - ваши координаты.\n`;
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
      console.log('distdistPL', battleData.battle.battlePlayer.position);
      console.log('distdistEN', enemy.position);
      console.log('distdist', dist);
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
        'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
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
    let log = `Вам на пути встретились бандиты. Началась перестрелка. Чтобы сбежать отдалитесь от противника на 500м. \n`;
    log += `\n[➡️: ${this.formatCoord(
      battleData.battle.battlePlayer.position.x,
    )}, ⬆️: ${this.formatCoord(
      battleData.battle.battlePlayer.position.y,
    )}] - ваши координаты. В руках у вас ${
      battleData.battle.battlePlayer.gun.name
    }.\n`;
    log += this.getEnemiesPositions(
      battleData.battle.enemyList,
      battleData.battle.battlePlayer,
    );
    this.appService.updateDisplay(
      playerData.playerProgress,
      keyboard,
      log,
      'https://sun9-2.userapi.com/impg/8D9R-PqX4qIvNk1r7FQ4eP1KfPiWcUJFoN3uRw/B7-a2BJJtC4.jpg?size=700x538&quality=95&sign=becda26a8a3aad44cb19b373ddaa84e8&type=album',
    );
  }

  getEnemiesPositions(enemyList: NpcObj[], player): string {
    let text = '\n';
    let enemyPosText = '';
    for (let i = 0; i < enemyList.length; i++) {
      const enemy: NpcObj = enemyList[i];
      const distance = this.calculateDistance(player.position, enemy.position);
      enemyPosText += `\n[➡️: ${this.formatCoord(
        enemy.position.x,
      )}, ⬆️: ${this.formatCoord(enemy.position.y)}] - координаты ${
        enemy.name
      }. Он находится на расстоянии ${distance}.`;
      enemyPosText += ` В руках: ${enemy.gun.name}.\n`;
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
    return;
  }
}
