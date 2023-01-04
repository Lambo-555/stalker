"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestWizard = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
let TestWizard = class TestWizard {
    step1(ctx) {
        ctx.reply('first scene');
        ctx.wizard.next();
    }
    async hi(ctx) {
        ctx.reply('hello');
        ctx.reply('moto');
    }
    async step2(ctx) {
        ctx.reply('last scene');
        ctx.scene.leave();
    }
};
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(1),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestWizard.prototype, "step1", null);
__decorate([
    (0, nestjs_telegraf_1.Hears)(/hi.*/gim),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestWizard.prototype, "hi", null);
__decorate([
    (0, nestjs_telegraf_1.WizardStep)(2),
    __param(0, (0, nestjs_telegraf_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestWizard.prototype, "step2", null);
TestWizard = __decorate([
    (0, nestjs_telegraf_1.Wizard)('test')
], TestWizard);
exports.TestWizard = TestWizard;
//# sourceMappingURL=example.wizzard.js.map