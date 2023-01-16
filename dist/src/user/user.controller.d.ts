import { UserService } from './user.service';
import { UsersEntity } from './entities/users.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(): Promise<UsersEntity[]>;
    findOne(id: number): Promise<UsersEntity>;
    create(user: UsersEntity): Promise<UsersEntity>;
    update(id: number, user: UsersEntity): Promise<void>;
    delete(id: number): Promise<void>;
}
