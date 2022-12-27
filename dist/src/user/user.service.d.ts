import { Repository } from 'typeorm';
import { Users } from './entities/users.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<Users>);
    findAll(): Promise<Users[]>;
    findOne(id: number): Promise<Users>;
    create(user: Users): Promise<Users>;
    update(id: number, user: Users): Promise<void>;
    delete(id: number): Promise<void>;
}
