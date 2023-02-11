import { LocationsEntity } from 'src/user/entities/locations.entity';
import { ProgressEntity } from 'src/user/entities/progress.entity';
import { UsersEntity } from 'src/user/entities/users.entity';

export class PlayerDataDto {
  player: UsersEntity;
  playerLocation: LocationsEntity;
  playerProgress: ProgressEntity;
}
