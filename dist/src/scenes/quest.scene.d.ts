import { NextFunction } from 'express';
import { AppService } from 'src/app.service';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class QuestScene {
    private readonly appService;
    private readonly logger;
    constructor(appService: AppService);
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onChooseChapter(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onLeaveCommand(ctx: TelegrafContext): Promise<void>;
    onSceneLeave(ctx: TelegrafContext): Promise<void>;
}
