import { NextFunction } from 'express';
import { AppService } from 'src/app.service';
import { Anomalies } from 'src/user/entities/anomalies.entity';
import { Artifacts } from 'src/user/entities/artifacts.entity';
import { Chapters } from 'src/user/entities/chapters.entity';
import { Choices } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { Progress } from 'src/user/entities/progress.entity';
import { RoadsEntity } from 'src/user/entities/roads.entity';
import { Users } from 'src/user/entities/users.entity';
import { Scenes } from 'telegraf';
import { Repository } from 'typeorm';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class QuestScene {
    private readonly appService;
    private readonly usersRepository;
    private readonly chaptersRepository;
    private readonly choicesRepository;
    private readonly progressRepository;
    private readonly inventoryItemsRepository;
    private readonly artifactsRepository;
    private readonly anomaliesRepository;
    private readonly locationsRepository;
    private readonly roadsRepository;
    private readonly logger;
    constructor(appService: AppService, usersRepository: Repository<Users>, chaptersRepository: Repository<Chapters>, choicesRepository: Repository<Choices>, progressRepository: Repository<Progress>, inventoryItemsRepository: Repository<InventoryItems>, artifactsRepository: Repository<Artifacts>, anomaliesRepository: Repository<Anomalies>, locationsRepository: Repository<LocationsEntity>, roadsRepository: Repository<RoadsEntity>);
    onRegister(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onChooseChapter(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onLeaveCommand(ctx: Scenes.SceneContext): Promise<void>;
    onSceneLeave(ctx: Scenes.SceneContext): Promise<void>;
}
