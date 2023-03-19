import { DatabaseService } from './database.service';
import { UsersEntity } from './entities/users.entity';
export declare class DatabaseController {
    private readonly userService;
    constructor(userService: DatabaseService);
    findAll(): Promise<UsersEntity[]>;
    findOne(id: number): Promise<UsersEntity>;
    create(user: UsersEntity): Promise<UsersEntity>;
    update(id: number, user: UsersEntity): Promise<void>;
    delete(id: number): Promise<void>;
}
