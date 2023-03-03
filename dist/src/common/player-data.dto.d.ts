import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { UsersEntity } from 'src/user/entities/users.entity';
export declare class PlayerDataDto {
    player: UsersEntity;
    playerLocation: LocationsEntity;
    playerProgress: ProgressEntity;
    enemyList?: EnemyObj[];
}
export interface EnemyObj {
    position: {
        x: number;
        y: number;
    };
    isAlive: boolean;
    health: number;
    armor?: number;
    name: string;
    group?: 'Бандиты' | 'Армия' | 'Монолит' | 'Зомби';
}
