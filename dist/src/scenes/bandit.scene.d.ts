import { AppService } from 'src/app.service';
import { GunInterface, NpcObj } from 'src/common/player-data.dto';
import { Scenes } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class BanditScene {
    private readonly appService;
    private readonly logger;
    private readonly navigationKeyboard;
    constructor(appService: AppService);
    calculateDamageForGun(gun: GunInterface, distance: number): number;
    calculateSpreadForGun(gun: GunInterface, distance: number): number;
    calculateDistance(posOne: {
        x: number;
        y: number;
    }, posTwo: {
        x: number;
        y: number;
    }): number;
    calculateSpreadByRounds(shotsPrev: any, distance: any): number;
    calculateDamage(distance: number, damage: number): number;
    formatCoord(coord: number): string;
    moveEnemyByGun(player: NpcObj, enemy: NpcObj): NpcObj;
    attackEnemy(ctx: TelegrafContext): Promise<void>;
    onMove(ctx: TelegrafContext): Promise<void>;
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    getEnemiesPositions(enemyList: NpcObj[], player: any): string;
    onLeaveCommand(ctx: TelegrafContext): Promise<void>;
    enterBanditScene(ctx: Scenes.SceneContext): Promise<void>;
}
