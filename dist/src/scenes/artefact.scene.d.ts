import { NextFunction } from 'express';
import { AppService } from 'src/app.service';
import { Anomalies } from 'src/user/entities/anomalies.entity';
import { Artifacts } from 'src/user/entities/artifacts.entity';
import { ChaptersEntity } from 'src/user/entities/chapters.entity';
import { ChoicesEntity } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { UsersEntity } from 'src/user/entities/users.entity';
import { Scenes } from 'telegraf';
import { Repository } from 'typeorm';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class ArtefactScene {
    private readonly appService;
    private readonly usersRepository;
    private readonly chaptersRepository;
    private readonly choicesRepository;
    private readonly progressRepository;
    private readonly inventoryItemsRepository;
    private readonly artifactsRepository;
    private readonly anomaliesRepository;
    private readonly locationsRepository;
    private readonly logger;
    private userData;
    constructor(appService: AppService, usersRepository: Repository<UsersEntity>, chaptersRepository: Repository<ChaptersEntity>, choicesRepository: Repository<ChoicesEntity>, progressRepository: Repository<ProgressEntity>, inventoryItemsRepository: Repository<InventoryItems>, artifactsRepository: Repository<Artifacts>, anomaliesRepository: Repository<Anomalies>, locationsRepository: Repository<LocationsEntity>);
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onChoose(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    anomalyTrue(ctx: TelegrafContext): Promise<void>;
    anomalyFalse(ctx: TelegrafContext): Promise<void>;
    onLeaveCommand(ctx: Scenes.SceneContext): Promise<void>;
    onSceneLeave(ctx: Scenes.SceneContext): Promise<void>;
}
