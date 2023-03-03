import { NextFunction } from 'express';
import { AppService } from 'src/app.service';
import { RoadsEntity } from 'src/user/entities/roads.entity';
import { Repository } from 'typeorm';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class LocationScene {
    private readonly appService;
    private readonly roadsRepository;
    private readonly logger;
    constructor(appService: AppService, roadsRepository: Repository<RoadsEntity>);
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onChoose(ctx: TelegrafContext, next: NextFunction): Promise<unknown>;
    chooseBattleByLocation(ctx: TelegrafContext, location: string, nextChapter: any): Promise<unknown>;
    onLeaveCommand(ctx: TelegrafContext): Promise<void>;
}
