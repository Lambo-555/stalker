import { Scenes } from 'telegraf';
import { NextFunction } from 'express';
import { TelegrafContext } from 'src/interfaces/telegraf-context.interface';
import { AppService } from './app.service';
export default class AppUpdate {
    private readonly appService;
    private readonly logger;
    constructor(appService: AppService);
    onApplicationBootstrap(): void;
    onUse(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onDisplay(ctx: TelegrafContext): Promise<void>;
    onMenu(ctx: TelegrafContext): Promise<void>;
    enterBanditScene(ctx: Scenes.SceneContext): Promise<void>;
}
