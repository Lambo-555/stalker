import { NextFunction } from 'express';
import { TelegrafContext } from 'src/interfaces/telegraf-context.interface';
import { Users } from './user/entities/users.entity';
import { AppService } from './app.service';
import { Repository } from 'typeorm';
import { Chapters } from './user/entities/chapters.entity';
import { Choices } from './user/entities/choices.entity';
import { Progress } from './user/entities/progress.entity';
import { InventoryItems } from './user/entities/inventory_items.entity';
export default class AppUpdate {
    private readonly appService;
    private readonly usersRepository;
    private readonly chaptersRepository;
    private readonly choicesRepository;
    private readonly progressRepository;
    private readonly inventoryItemsRepository;
    private readonly logger;
    constructor(appService: AppService, usersRepository: Repository<Users>, chaptersRepository: Repository<Chapters>, choicesRepository: Repository<Choices>, progressRepository: Repository<Progress>, inventoryItemsRepository: Repository<InventoryItems>);
    onApplicationBootstrap(): void;
    getCurrentChapter(userId: number): Promise<Chapters>;
    getChoices(telegram_id: number): Promise<Choices[]>;
    makeChoice(userId: number, choiceId: number): Promise<Chapters>;
    buyItem(telegram_id: number, itemId: number): Promise<void>;
    onRegister(ctx: TelegrafContext, next: NextFunction): Promise<void>;
    onMenu(ctx: TelegrafContext): Promise<void>;
    onChapter(ctx: TelegrafContext): Promise<void>;
}
