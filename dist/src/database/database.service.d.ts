import { Repository } from 'typeorm';
import { UsersEntity } from './entities/users.entity';
export declare class DatabaseService {
    private readonly userRepository;
    constructor(userRepository: Repository<UsersEntity>);
    findAll(): Promise<UsersEntity[]>;
    findOne(id: number): Promise<UsersEntity>;
    create(user: UsersEntity): Promise<UsersEntity>;
    update(id: number, user: UsersEntity): Promise<void>;
    delete(id: number): Promise<void>;
}
