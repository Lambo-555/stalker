import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { AppService } from './app.service';
import AppUpdate from './app.update';
import { ChaptersEntity } from './database/entities/chapters.entity';
import { ProgressEntity } from './database/entities/progress.entity';
import { ChoicesEntity } from './database/entities/choices.entity';
import { InventoryItems } from './database/entities/inventory_items.entity';
import { UsersEntity } from './database/entities/users.entity';
import { DatabaseModule } from './database/database.module';
import { TestWizard } from './scenes/registration.wizzard';
import { AnomalyRoadScene } from './scenes/anomaly.scene';
import { MutantScene } from './scenes/mutant.scene';
import { ArtefactScene } from './scenes/artefact.scene';
import { Anomalies } from './database/entities/anomalies.entity';
import { Artifacts } from './database/entities/artifacts.entity';
import { LocationsEntity } from './database/entities/locations.entity';
import { RoadsEntity } from './database/entities/roads.entity';
import { LocationScene } from './scenes/location.scene';
import { QuestScene } from './scenes/quest.scene';
import { MutantsEntity } from './database/entities/mutants.entity';
import { PdaScene } from './scenes/pda.scene';
import { QuestsEntity } from './database/entities/quests.entity';
import { BattleScene } from './scenes/battle.scene';
import { GunsEntity } from './database/entities/guns.entity';
import { NpcEntity } from './database/entities/npcs.entity';
import { StoriesEntity } from './database/entities/stories.entity';

const scenes = [
  TestWizard,
  AnomalyRoadScene,
  MutantScene,
  ArtefactScene,
  LocationScene,
  QuestScene,
  PdaScene,
  BattleScene,
];

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '194.58.107.23',
      port: 5432,
      username: 'stalker',
      password: 'stalker',
      database: 'stalker',
      entities: [
        UsersEntity,
        ChaptersEntity,
        ChoicesEntity,
        InventoryItems,
        ProgressEntity,
        Anomalies,
        Artifacts,
        LocationsEntity,
        RoadsEntity,
        MutantsEntity,
        QuestsEntity,
        NpcEntity,
        GunsEntity,
        StoriesEntity,
      ],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([
      UsersEntity,
      ChaptersEntity,
      ChoicesEntity,
      InventoryItems,
      ProgressEntity,
      Anomalies,
      Artifacts,
      LocationsEntity,
      RoadsEntity,
      MutantsEntity,
      QuestsEntity,
      NpcEntity,
      GunsEntity,
      StoriesEntity,
    ]),
    TelegrafModule.forRoot({
      token: '6159975411:AAEOyCa4O_FqV8dIougNxOo-9g9ZdEGx-vY',
      middlewares: [session()],
    }),
  ],
  providers: [AppUpdate, AppService, ...scenes],
})
export class AppModule {}
