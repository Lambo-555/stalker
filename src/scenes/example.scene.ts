// import { PostgresLibService } from '@app/postgres-lib';
// import { Cell } from '@app/postgres-lib/entities/cell.entity';
// import { Inventory } from '@app/postgres-lib/entities/inventory.entity';
// import { Player } from '@app/postgres-lib/entities/player.entity';
// import { Inject } from '@nestjs/common';
// import { ActionTypeEnum } from 'apps/adventure/src/enums/action-type.enum';
// import { NextFunction } from 'express';
// import { BiomEnum } from 'libs/common/src';
// import { CellNameEnum } from 'libs/common/src/enums/cell-name.enum';
// import { JobEnum } from 'libs/common/src/enums/job.enum';
// import { MissionStatusEnum } from 'libs/common/src/enums/mission-status.enum';
// import { NpcTypeEnum } from 'libs/common/src/enums/npc-type.enum';
// import { ScenesEnum } from 'libs/common/src/enums/scenes.enum';
// import { SwitchTypeEnum } from 'libs/common/src/enums/switch-type.enum';
// import { Scene, SceneEnter, SceneLeave, Command, Hears, Ctx, Action, TELEGRAF_STAGE, Next, Use } from 'nestjs-telegraf';
// import { Markup, Scenes } from 'telegraf';
// import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
// import { TelegrafContext } from '../interfaces/telegraf-context.interface';
// import { JobService } from '../services/job.service';
// import { MissionsService } from '../services/missions.service';
// import { NpcService } from '../services/npc.service';
// import { RoadService } from '../services/road.service';
// import { TelegramService } from '../services/telegram.service';

// // ганг карс
// // набираешь тиму, катаешься по району и отстреливаешь наркомафию
// // цель игры - собрать тиму, оптимизировать пушки, нанимать норма водителя
// // авто могут тормозить, маневрировать, гоняться на скорость
// // можно посылать потрульные машины на рейды будучи дома
// // сделать район богаче - новая миссия
// // чем богаче и умнее район, тем больше примочек на автоматы

// @Scene(ScenesEnum.COBALT_SCENE)
// export class CobaltScene {
//     constructor(
//         private readonly postgresLibService: PostgresLibService,
//         private readonly missionsService: MissionsService,
//         private readonly telegramService: TelegramService,
//         private readonly roadService: RoadService,
//         private readonly npcService: NpcService,
//         private readonly jobService: JobService,
//     ) { }

//     async getOrCreateUser(ctx: Scenes.SceneContext): Promise<Player> {
//         // @ts-ignore
//         const telegramId: number = ctx?.message?.from?.id || ctx?.update?.callback_query?.from.id;
//         if (!telegramId) return;
//         const player: Player = await this.postgresLibService.findOneUserByTelegramId(telegramId);
//         if (!player) {
//             const newUser: Player = await this.postgresLibService.createOnePlayer({
//                 telegramId,
//                 cell_id: (await this.postgresLibService.findAllCell())[0]?.id || 1,
//                 inventory_id: (await this.postgresLibService.createOneInventory()).id,
//             });
//             await ctx.reply('Welcome to Cobalt series! Type command (or find in menu) "/help" for nice start. You wakeuped naked on the beach and do not remember nothing...');
//             return newUser;
//         }
//         if (!player.inventory_id) {
//             player.inventory_id = (await this.postgresLibService.createOneInventory()).id;
//             const playerUpdated = await this.postgresLibService.updateOnePlayer(player);
//         }
//         if (!player.cell_id) {
//             player.cell_id = (await this.postgresLibService.findByNameCell(CellNameEnum.Beach)).id;
//             const playerUpdated = await this.postgresLibService.updateOnePlayer(player);
//         }
//         return player;
//     }

//     generateEnemyList(cell: Cell): InlineKeyboardButton.CallbackButton[] {
//         const buttonList = [];
//         buttonList.push(Markup.button.callback('enemy🧠', SwitchTypeEnum.NPC + NpcTypeEnum.ANIMAL_ENEMY))
//         return buttonList;
//     }

//     generateEventList(cell: Cell): InlineKeyboardButton.CallbackButton[] {
//         // if (cell) return [];
//         const buttonList = [];
//         const check = (chance: number) => {
//             return Math.random() * 100 >= 100 - chance;
//         };
//         // if (check(cell.npc_enemy_chance)) { buttonList.push(Markup.button.callback('enemy🧠', SwitchTypeEnum.NPC + NpcTypeEnum.ANIMAL_ENEMY)) }
//         if (check(cell.npc_spectator_chance)) { buttonList.push(Markup.button.callback('neutral🍖', SwitchTypeEnum.NPC + NpcTypeEnum.ANIMAL_NEUTRAL)) }
//         if (check(cell.npc_transport_chance)) { buttonList.push(Markup.button.callback('transport🚖', SwitchTypeEnum.NPC + NpcTypeEnum.ANIMAL_TRANSPORT)) }
//         if (check(cell.cloth_chance)) { buttonList.push(Markup.button.callback('cloth🧶', SwitchTypeEnum.JOB + JobEnum.HARVESTING)) }
//         if (check(cell.wood_chance)) { buttonList.push(Markup.button.callback('wood🪵', SwitchTypeEnum.JOB + JobEnum.CHOPPING)) }
//         if (check(cell.scrap_chance)) { buttonList.push(Markup.button.callback('scrap⚙️', SwitchTypeEnum.JOB + JobEnum.BUSTING)) }
//         if (check(cell.stone_chance)) { buttonList.push(Markup.button.callback('stone🪨', SwitchTypeEnum.JOB + JobEnum.STONEMINING)) }
//         if (check(cell.sulfur_chance)) { buttonList.push(Markup.button.callback('sulfur🌕', SwitchTypeEnum.JOB + JobEnum.SULFURMINING)) }
//         if (check(cell.weapon_chance)) { buttonList.push(Markup.button.callback('weapon🔫', SwitchTypeEnum.JOB + JobEnum.BUSTING)) }
//         if (check(cell.ingredient_chance)) { buttonList.push(Markup.button.callback('ingredient🪶', SwitchTypeEnum.JOB + JobEnum.HARVESTING)) }
//         return buttonList;
//     }

//     async generateRoadList(cell: Cell): Promise<InlineKeyboardButton.CallbackButton[]> {
//         if (!cell) return [];
//         const roadList = [];
//         if (!cell.next) return [];
//         const nextRoads: number[] = cell.next;
//         if (nextRoads.length === 0) return [];
//         if (cell.biom === BiomEnum.SAVEZONE) roadList.push(Markup.button.callback('📍Save-City🏚', 'savezoneScene'));
//         for (let i = 0; i < nextRoads.length; i++) {
//             const nextRoad: Cell = await this.postgresLibService.findOneCell(nextRoads[i]);
//             roadList.push(Markup.button.callback('📍 ' + nextRoad.name, SwitchTypeEnum.LOCATION + nextRoad.id));
//         }
//         return roadList;
//     }

//     @Action('savezoneScene')
//     async enterSaveZone(@Ctx() ctx: Scenes.SceneContext) {
//         await ctx.scene.enter(ScenesEnum.SAVE_ZONE_SCENE);
//     }

//     @Action('gamblingScene')
//     async enterGambling(@Ctx() ctx: Scenes.SceneContext) {
//         await ctx.scene.enter(ScenesEnum.GAMBLING_SCENE);
//     }

//     @Use()
//     async actionsMiddleware(@Ctx() ctx: TelegrafContext, @Next() next: NextFunction) {
//         const messageId = ctx?.callbackQuery?.message?.message_id;
//         // console.log('cobalt', ctx?.scene?.current?.id); // TODO check scene
//         if (!ctx.scene.session.state?.hasOwnProperty('lastUsedMessageId')) {
//             ctx.scene.session.state = { lastUsedMessageId: messageId - 1 };
//         }
//         if (messageId > ctx.scene.session.state['lastUsedMessageId']) {
//             // console.log('good', { messageId, state: ctx.scene.session.state });
//             ctx.scene.session.state = { lastUsedMessageId: messageId };
//         } else {
//             // console.log('bad', { messageId, state: ctx.scene.session.state });
//             ctx.reply('Too late for thinking about it.');
//             return;
//         }
//         // try {
//         //     await ctx.deleteMessage();
//         // } catch (error) {
//         //     ctx.reply('error');
//         // }
//         const phrases = ['You are busy.', 'Wait plz.', 'Not now.', 'Need some time.', 'Easy, man, easy.'];
//         const player: Player = await this.getOrCreateUser(ctx);
//         player.busy = JobEnum.FREE;
//         const player2: Player = await this.postgresLibService.updateOnePlayer(player);
//         if (player.busy === JobEnum.FREE) {
//             next();
//         } else {
//             const answer = phrases[Math.floor(Math.random() * phrases.length)];
//             ctx.reply(answer);
//         }
//     }

//     @SceneEnter()
//     async onSceneEnter(@Ctx() ctx: TelegrafContext) {
//         const player: Player = await this.getOrCreateUser(ctx);
//         const cell: Cell = await this.postgresLibService.findOneCell(player.cell_id);
//         console.log({ player });
//         const inventory: Inventory = await this.postgresLibService.findOneInventory(player.inventory_id);
//         let message: string = '';
//         message += `I'm  ${player.nickname} and feel like have ${this.telegramService.progressGraphics(100, player.health)} HP.\n`;
//         message += `This place calls ${cell?.name}.\n`;
//         message += `Inventory  ${inventory.size} size.\n`;
//         await ctx.reply(message, Markup.inlineKeyboard([Markup.button.callback('go', 'play')]));
//     }

//     @Action('play')
//     async market(@Ctx() ctx: Scenes.SceneContext) {
//         const checkCellChance = (chance: number) => {
//             return Math.random() * 100 >= 100 - chance;
//         };
//         const player: Player = await this.getOrCreateUser(ctx);
//         const cell: Cell = await this.postgresLibService.findOneCell(player?.cell_id);
//         const keyboard = this.generateEventList(cell);
//         const enemy = this.generateEnemyList(cell);
//         const roads = await this.generateRoadList(cell);
//         const commonButtuons = [];
//         commonButtuons.push(Markup.button.callback('🍺 MISSION', 'mission'));
//         commonButtuons.push(Markup.button.callback('🔙 TO MENU', 'leave'));
//         commonButtuons.push(Markup.button.callback('🎒 STATS', 'mystats'));
//         if (checkCellChance(cell.npc_enemy_chance)) {
//             await ctx.reply('Oppps, I meet some on my way...', Markup.inlineKeyboard([enemy]));
//         } else {
//             await ctx.reply('What next?', Markup.inlineKeyboard([commonButtuons, keyboard, ...this.telegramService.menuSplitter(roads, 2)]));
//         }
//     }



//     @Action('mystats')
//     async mystats(@Ctx() ctx: Scenes.SceneContext) {
//         const player: Player = await this.getOrCreateUser(ctx);
//         const cell: Cell = await this.postgresLibService.findOneCell(player?.cell_id);
//         const inventory: Inventory = await this.postgresLibService.findOneInventory(player?.inventory_id);
//         let message = '*My stats:*\n';
//         message += `I'm on ${cell.name}\n`;
//         message += `My level is ${player.level}🧠\n`;
//         message += `I have:
//         scrap - ${inventory.scrap} ⚙️
//         stone - ${inventory.stone} 🪨
//         wood - ${inventory.wood} 🪵
//         sulfur - ${inventory.sulfur} 🌕
//         cloth - ${inventory.cloth} 🧶
//         meat - ${inventory.meat} 🍖
//         stone tool - ${inventory.stoneTool ? 'yes' : 'no'},
//         scrap tool - ${inventory.scrapTool ? 'yes' : 'no'},
//         wood tool - ${inventory.woodTool ? 'yes' : 'no'},
//         transport - ${player.transport},
//         \n`;
//         await ctx.replyWithMarkdown(message, Markup.inlineKeyboard([Markup.button.callback('go', 'play')]));
//     }

//     @Action('mission')
//     async mission(@Ctx() ctx: Scenes.SceneContext) {
//         const player: Player = await this.getOrCreateUser(ctx);
//         const inventory: Inventory = await this.postgresLibService.findOneInventory(player?.inventory_id);
//         const missionStatus = await this.missionsService.switchMission(player);
//         console.log(missionStatus, inventory);
//         const keyBoard = Markup.inlineKeyboard([Markup.button.callback('Lests do it!', 'play')]);
//         // ctx.reply('Lets go spoone... sponsors 🥄', keyBoard);
//         ctx.reply(missionStatus.statusText, keyBoard);
//     }

//     @Action(new RegExp(SwitchTypeEnum.JOB + '.*', 'gm'))
//     async job(@Ctx() ctx: Scenes.SceneContext, @Next() next) {
//         // @ts-ignore
//         const match = ctx.match[0];
//         const jobToDo = match?.slice(SwitchTypeEnum.JOB.length, match.length);
//         if (Object.keys(JobEnum).includes(jobToDo)) {
//             await ctx.reply('In progress...');
//             // console.log('yes ', { jobToDo });
//             const player: Player = await this.getOrCreateUser(ctx);
//             player.busy = jobToDo;
//             const playerUpdated = await this.postgresLibService.updateOnePlayer(player);
//             const job = await this.jobService.switchJob(player);
//             const keyboard = Markup.inlineKeyboard([Markup.button.callback('Go next!', 'play')]);
//             await ctx.reply(job?.message || 'done', keyboard);
//             // ctx.reply('Lets go spoone... sponsors 🥄', keyBoard);
//         } else {
//             console.log('not ', { jobToDo });
//         }
//         next();
//     }

//     @Action(new RegExp(SwitchTypeEnum.LOCATION + '.*', 'gm'))
//     async road(@Ctx() ctx: Scenes.SceneContext, @Next() next) {
//         // @ts-ignore
//         const match = ctx.match[0];
//         const cellId: Cell['id'] = match?.slice(SwitchTypeEnum.LOCATION.length, match.length);
//         if (cellId) {
//             await ctx.reply('On my way...');
//             const player: Player = await this.getOrCreateUser(ctx);
//             player.busy = JobEnum.BUSY;
//             const playerUpdated = await this.postgresLibService.updateOnePlayer(player);
//             const nextPoint = await this.roadService.switchLocation(player, cellId, ctx);
//             const keyboard = Markup.inlineKeyboard([Markup.button.callback('Go next!', 'play')]);
//             await ctx.reply(nextPoint?.message || 'come', keyboard);
//         } else {
//             console.log('not ', { cellId });
//         }
//         next();
//     }

//     @Action(new RegExp(SwitchTypeEnum.NPC + '.*', 'gm'))
//     async npc(@Ctx() ctx: Scenes.SceneContext, @Next() next) {
//         const keyBoard = Markup.inlineKeyboard([Markup.button.callback('ok, go', 'play')]);
//         // @ts-ignore // библиотека не видит match в ctx
//         const match = ctx.match[0];
//         const npcType: NpcTypeEnum = match?.slice(SwitchTypeEnum.NPC.length, match.length);
//         console.log({ npcType, match }, SwitchTypeEnum.NPC.length)
//         if (Object.keys(NpcTypeEnum).includes(npcType)) {
//             console.log('yer.fight', { npcType });
//             const player: Player = await this.getOrCreateUser(ctx);
//             player.busy = JobEnum.BUSY;
//             await this.postgresLibService.updateOnePlayer(player);
//             const npc = await this.npcService.getNpc(player, npcType); // TODO NPC service
//             if (!npc) await ctx.reply('No animals here.', Markup.inlineKeyboard([Markup.button.callback('Go next!', 'play')]));
//             if (npc?.type === NpcTypeEnum.ANIMAL_TRANSPORT) {
//                 const userMaster = await this.npcService.masterTransport(player, npc);
//                 ctx.reply(`Nice to ride ${userMaster.transport}`, keyBoard);
//             }
//             if (npc?.type === NpcTypeEnum.ANIMAL_ENEMY) {
//                 const fightResult = await this.npcService.fight(player, npc);
//                 ctx.reply(fightResult.message, keyBoard);
//             }
//             if (npc?.type === NpcTypeEnum.ANIMAL_NEUTRAL) {
//                 const eatResult = await this.npcService.eat(player, npc);
//                 ctx.reply(eatResult.message, keyBoard);
//             }
//         } else {
//             console.log('not.next', { npcType });
//         }
//         next();
//     }

//     @Action('leave')
//     async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
//         await ctx.scene.leave();
//     }

//     @SceneLeave()
//     async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
//         await ctx.reply('I move to next place.');
//     }

// }