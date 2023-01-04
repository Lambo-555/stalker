import { NextFunction } from 'express';
import { AppService } from 'src/app.service';
import { Chapters } from 'src/user/entities/chapters.entity';
import { Choices } from 'src/user/entities/choices.entity';
import { InventoryItems } from 'src/user/entities/inventory_items.entity';
import { Progress } from 'src/user/entities/progress.entity';
import { Users } from 'src/user/entities/users.entity';
import { Scenes } from 'telegraf';
import { Repository } from 'typeorm';
import { TelegrafContext } from '../interfaces/telegraf-context.interface';
export declare class MutantScene {
    private readonly appService;
    private readonly usersRepository;
    private readonly chaptersRepository;
    private readonly choicesRepository;
    private readonly progressRepository;
    private readonly inventoryItemsRepository;
    private readonly logger;
    constructor(appService: AppService, usersRepository: Repository<Users>, chaptersRepository: Repository<Chapters>, choicesRepository: Repository<Choices>, progressRepository: Repository<Progress>, inventoryItemsRepository: Repository<InventoryItems>);
    onRegister(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onSceneEnter(ctx: TelegrafContext): Promise<void>;
    mutantWays(ctx: TelegrafContext): Promise<void>;
    actionChoose(ctx: TelegrafContext): Promise<void>;
    enterQuestScene(ctx: Scenes.SceneContext): Promise<void>;
    market(ctx: Scenes.SceneContext): Promise<void>;
    mystats(ctx: Scenes.SceneContext): Promise<void>;
    mission(ctx: Scenes.SceneContext): Promise<void>;
    job(ctx: Scenes.SceneContext, next: any): Promise<void>;
    onLeaveCommand(ctx: Scenes.SceneContext): Promise<void>;
    onSceneLeave(ctx: Scenes.SceneContext): Promise<void>;
}
