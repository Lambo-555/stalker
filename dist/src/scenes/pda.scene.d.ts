import { AppService } from 'src/app.service';
import { Scenes } from 'telegraf';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class PdaScene {
    private readonly appService;
    private readonly logger;
    constructor(appService: AppService);
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onLeaveCommand(ctx: Scenes.SceneContext): Promise<void>;
}
