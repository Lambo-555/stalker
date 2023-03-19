import { NextFunction } from 'express';
import { AppService } from 'src/app.service';
import { Scenes, Telegraf } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class LocationScene {
    private bot;
    private readonly appService;
    private readonly logger;
    constructor(bot: Telegraf<Scenes.SceneContext>, appService: AppService);
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onChox(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onChoose(ctx: TelegrafContext, next: NextFunction): Promise<unknown>;
    chooseBattleByLocation(ctx: TelegrafContext, location: string, nextChapter: any): Promise<unknown>;
    onLeaveCommand(ctx: TelegrafContext): Promise<void>;
}
