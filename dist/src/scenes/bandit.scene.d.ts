import { AppService } from 'src/app.service';
import { Anomalies } from 'src/user/entities/anomalies.entity';
import { Artifacts } from 'src/user/entities/artifacts.entity';
import { ChaptersEntity } from 'src/user/entities/chapters.entity';
import { ChoicesEntity } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { QuestsEntity } from 'src/user/entities/quests.entity';
import { RoadsEntity } from 'src/user/entities/roads.entity';
import { UsersEntity } from 'src/user/entities/users.entity';
import { Context, Scenes, Telegraf } from 'telegraf';
import { Repository } from 'typeorm';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class BanditScene {
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
    private readonly questsEntity;
    private readonly bot;
    private readonly logger;
    constructor(appService: AppService, usersRepository: Repository<UsersEntity>, chaptersRepository: Repository<ChaptersEntity>, choicesRepository: Repository<ChoicesEntity>, progressRepository: Repository<ProgressEntity>, inventoryItemsRepository: Repository<InventoryItems>, artifactsRepository: Repository<Artifacts>, anomaliesRepository: Repository<Anomalies>, locationsRepository: Repository<LocationsEntity>, roadsRepository: Repository<RoadsEntity>, questsEntity: Repository<QuestsEntity>, bot: Telegraf<Context>);
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
    buttlePart(enemyList: any): string;
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    onLeaveCommand(ctx: Scenes.SceneContext): Promise<void>;
    onSceneLeave(ctx: Scenes.SceneContext): Promise<void>;
}
