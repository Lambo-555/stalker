import { AppService } from 'src/app.service';
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
    generateRandomEnemies(): {
        x: number;
        y: number;
        name: string;
    }[];
    battlePart(enemyList: any): string;
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onLeaveCommand(ctx: TelegrafContext): Promise<void>;
    enterBanditScene(ctx: Scenes.SceneContext): Promise<void>;
}
