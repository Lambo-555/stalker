import { UserService } from './user.service';
import { Users } from './entities/users.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(): Promise<Users[]>;
    findOne(id: number): Promise<Users>;
    create(user: Users): Promise<Users>;
    update(id: number, user: Users): Promise<void>;
    delete(id: number): Promise<void>;
}
