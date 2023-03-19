"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const app_service_1 = require("./app.service");
const app_update_1 = require("./app.update");
const chapters_entity_1 = require("./database/entities/chapters.entity");
const progress_entity_1 = require("./database/entities/progress.entity");
const choices_entity_1 = require("./database/entities/choices.entity");
const inventory_items_entity_1 = require("./database/entities/inventory_items.entity");
const users_entity_1 = require("./database/entities/users.entity");
const database_module_1 = require("./database/database.module");
const registration_wizzard_1 = require("./scenes/registration.wizzard");
const anomaly_scene_1 = require("./scenes/anomaly.scene");
const mutant_scene_1 = require("./scenes/mutant.scene");
const artefact_scene_1 = require("./scenes/artefact.scene");
const anomalies_entity_1 = require("./database/entities/anomalies.entity");
const artifacts_entity_1 = require("./database/entities/artifacts.entity");
const locations_entity_1 = require("./database/entities/locations.entity");
const roads_entity_1 = require("./database/entities/roads.entity");
const location_scene_1 = require("./scenes/location.scene");
const quest_scene_1 = require("./scenes/quest.scene");
const mutants_entity_1 = require("./database/entities/mutants.entity");
const pda_scene_1 = require("./scenes/pda.scene");
const quests_entity_1 = require("./database/entities/quests.entity");
const battle_scene_1 = require("./scenes/battle.scene");
const guns_entity_1 = require("./database/entities/guns.entity");
const npcs_entity_1 = require("./database/entities/npcs.entity");
const scenes = [
    registration_wizzard_1.TestWizard,
    anomaly_scene_1.AnomalyRoadScene,
    mutant_scene_1.MutantScene,
    artefact_scene_1.ArtefactScene,
    location_scene_1.LocationScene,
    quest_scene_1.QuestScene,
    pda_scene_1.PdaScene,
    battle_scene_1.BattleScene,
];
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: '194.58.107.23',
                port: 5432,
                username: 'stalker',
                password: 'stalker',
                database: 'stalker',
                entities: [
                    users_entity_1.UsersEntity,
                    chapters_entity_1.ChaptersEntity,
                    choices_entity_1.ChoicesEntity,
                    inventory_items_entity_1.InventoryItems,
                    progress_entity_1.ProgressEntity,
                    anomalies_entity_1.Anomalies,
                    artifacts_entity_1.Artifacts,
                    locations_entity_1.LocationsEntity,
                    roads_entity_1.RoadsEntity,
                    mutants_entity_1.MutantsEntity,
                    quests_entity_1.QuestsEntity,
                    npcs_entity_1.NpcEntity,
                    guns_entity_1.GunsEntity,
                ],
                synchronize: false,
            }),
            typeorm_1.TypeOrmModule.forFeature([
                users_entity_1.UsersEntity,
                chapters_entity_1.ChaptersEntity,
                choices_entity_1.ChoicesEntity,
                inventory_items_entity_1.InventoryItems,
                progress_entity_1.ProgressEntity,
                anomalies_entity_1.Anomalies,
                artifacts_entity_1.Artifacts,
                locations_entity_1.LocationsEntity,
                roads_entity_1.RoadsEntity,
                mutants_entity_1.MutantsEntity,
                quests_entity_1.QuestsEntity,
                npcs_entity_1.NpcEntity,
                guns_entity_1.GunsEntity,
            ]),
            nestjs_telegraf_1.TelegrafModule.forRoot({
                token: '6159975411:AAEOyCa4O_FqV8dIougNxOo-9g9ZdEGx-vY',
                middlewares: [(0, telegraf_1.session)()],
            }),
        ],
        providers: [app_update_1.default, app_service_1.AppService, ...scenes],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map