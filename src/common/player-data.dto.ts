import { GunsEntity } from 'src/database/entities/guns.entity';
import { LocationsEntity } from 'src/database/entities/locations.entity';
import { ProgressEntity } from 'src/database/entities/progress.entity';
import { UsersEntity } from 'src/database/entities/users.entity';

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
  gun?: GunsEntity;
  name: string;
  group?: string;
}

// export interface GunsEntity {
//   name: string;
//   optimal_distance: number;
//   base_damage: number;
//   optimal_modifier: number;
// }
