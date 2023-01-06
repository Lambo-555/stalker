import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { AppService } from './app.service';
import AppUpdate from './app.update';
import { Chapters } from './user/entities/chapters.entity';
import { Progress } from './user/entities/progress.entity';
import { Choices } from './user/entities/choices.entity';
import { InventoryItems } from './user/entities/inventory_items.entity';
import { Users } from './user/entities/users.entity';
import { UserModule } from './user/user.module';
import { TestWizard } from './scenes/registration.wizzard';
import { AnomalyRoadScene } from './scenes/anomaly.scene';
import { MutantScene } from './scenes/mutant.scene';
import { ArtefactScene } from './scenes/artefact.scene';
import { Anomalies } from './user/entities/anomalies.entity';
import { Artifacts } from './user/entities/artifacts.entity';
import { Maps } from './user/entities/maps.entity';
import { Roads } from './user/entities/roads.entity';
import { LocationScene } from './scenes/location.scene';

const scenes = [
  TestWizard,
  AnomalyRoadScene,
  MutantScene,
  ArtefactScene,
  LocationScene,
];

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'owner',
      password: 'owner',
      database: 'game',
      entities: [
        Users,
        Chapters,
        Choices,
        InventoryItems,
        Progress,
        Anomalies,
        Artifacts,
        Maps,
        Roads,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      Users,
      Chapters,
      Choices,
      InventoryItems,
      Progress,
      Anomalies,
      Artifacts,
      Maps,
      Roads,
    ]),
    TelegrafModule.forRoot({
      token: '5943057211:AAHh26OWDRO1fYtaGJtpL_lTSSTB-foTQWM',
      middlewares: [session()],
    }),
  ],
  providers: [AppUpdate, AppService, ...scenes],
})
export class AppModule {}
