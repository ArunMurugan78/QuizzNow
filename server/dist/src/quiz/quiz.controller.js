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
exports.QuizController = void 0;
const common_1 = require("@nestjs/common");
const authenticated_gaurd_1 = require("../auth/authenticated.gaurd");
const new_qa_1 = require("../qa/dto/new.qa");
const new_quiz_1 = require("./dto/new.quiz");
const quiz_service_1 = require("./quiz.service");
let QuizController = class QuizController {
    constructor(quizService) {
        this.quizService = quizService;
    }
    async newQuiz(data, req, res) {
        await this.quizService.createNewQuiz(req.user, data);
        return res.sendStatus(common_1.HttpStatus.CREATED);
    }
    async newQuestion(questionData, quizId, req, res) {
        await this.quizService.addNewQuestion(req.user, questionData, quizId);
        return res.sendStatus(common_1.HttpStatus.CREATED);
    }
};
__decorate([
    common_1.Post('new'),
    common_1.UseGuards(authenticated_gaurd_1.AuthenticatedGuard),
    common_1.UsePipes(common_1.ValidationPipe),
    __param(0, common_1.Body()), __param(1, common_1.Req()), __param(2, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [new_quiz_1.NewQuizDto, Object, Object]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "newQuiz", null);
__decorate([
    common_1.Post(':qid/question/new'),
    common_1.UseGuards(authenticated_gaurd_1.AuthenticatedGuard),
    common_1.UsePipes(common_1.ValidationPipe),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('qid')),
    __param(2, common_1.Req()),
    __param(3, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [new_qa_1.default, String, Object, Object]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "newQuestion", null);
QuizController = __decorate([
    common_1.Controller('quiz'),
    __metadata("design:paramtypes", [quiz_service_1.QuizService])
], QuizController);
exports.QuizController = QuizController;
//# sourceMappingURL=quiz.controller.js.map