import { AppService } from 'src/app.service';
import { EnemyObj } from 'src/common/player-data.dto';
import { Scenes } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class BanditScene {
    private readonly appService;
    private readonly logger;
    constructor(appService: AppService);
    calculateDistance(posOne: {
        x: number;
        y: number;
    }, posTwo: {
        x: number;
        y: number;
    }): number;
    calculateSpread(shotsPrev: any, distance: any): number;
    generatePlayerPosition(): {
        x: number;
        y: number;
    };
    calculateDamage(distance: number, damage: number): number;
    generateRandomEnemies(): EnemyObj[];
    battlePart(enemyList: any): string;
    attackEnemy(ctx: TelegrafContext): Promise<void>;
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    getEnemiesPositions(enemyList: EnemyObj[]): string;
    onLeaveCommand(ctx: TelegrafContext): Promise<void>;
    enterBanditScene(ctx: Scenes.SceneContext): Promise<void>;
}
