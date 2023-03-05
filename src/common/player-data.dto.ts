import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { UsersEntity } from 'src/user/entities/users.entity';

export class PlayerDataDto {
  player: UsersEntity;
  playerLocation: LocationsEntity;
  playerProgress: ProgressEntity;
  battle?: {
    enemyList: NpcObj[];
    battlePlayer: NpcObj;
  };
}

export interface NpcObj {
  position: {
    x: number;
    y: number;
  };
  isAlive: boolean;
  health: number;
  gun?: GunInterface;
  name: string;
  group?: 'Бандиты' | 'Армия' | 'Монолит' | 'Зомби';
}

export interface GunInterface {
  name: string;
  optimalDistance: number;
  baseDamage: number;
  magazine: number;
}
