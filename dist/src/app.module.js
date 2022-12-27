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
const chapters_entity_1 = require("./user/entities/chapters.entity");
const progress_entity_1 = require("./user/entities/progress.entity");
const choices_entity_1 = require("./user/entities/choices.entity");
const inventory_items_entity_1 = require("./user/entities/inventory_items.entity");
const users_entity_1 = require("./user/entities/users.entity");
const user_module_1 = require("./user/user.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'owner',
                password: 'owner',
                database: 'game',
                entities: [users_entity_1.Users, chapters_entity_1.Chapters, choices_entity_1.Choices, inventory_items_entity_1.InventoryItems, progress_entity_1.Progress],
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([
                users_entity_1.Users,
                chapters_entity_1.Chapters,
                choices_entity_1.Choices,
                inventory_items_entity_1.InventoryItems,
                progress_entity_1.Progress,
            ]),
            nestjs_telegraf_1.TelegrafModule.forRoot({
                token: '5943057211:AAHh26OWDRO1fYtaGJtpL_lTSSTB-foTQWM',
                middlewares: [(0, telegraf_1.session)()],
            }),
        ],
        providers: [app_update_1.default, app_service_1.AppService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map