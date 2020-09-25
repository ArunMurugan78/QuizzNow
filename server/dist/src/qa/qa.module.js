"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const qa_repository_1 = require("./qa.repository");
const qa_service_1 = require("./qa.service");
const qa_controller_1 = require("./qa.controller");
let QaModule = class QaModule {
};
QaModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([qa_repository_1.QARepository])],
        providers: [qa_repository_1.QARepository, qa_service_1.QaService],
        exports: [qa_repository_1.QARepository, qa_service_1.QaService],
        controllers: [qa_controller_1.QaController]
    })
], QaModule);
exports.QaModule = QaModule;
//# sourceMappingURL=qa.module.js.map