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
exports.QuizService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_typeorm_paginate_1 = require("nestjs-typeorm-paginate");
const new_qa_1 = require("../qa/dto/new.qa");
const qa_entity_1 = require("../qa/qa.entity");
const qa_service_1 = require("../qa/qa.service");
const user_entity_1 = require("../user/user.entity");
const typeorm_2 = require("typeorm");
const question_attempt_entity_1 = require("./entities/question_attempt.entity");
const quiz_entity_1 = require("./entities/quiz.entity");
const quiz_repository_1 = require("./quiz.repository");
const quiz_attempts_entity_1 = require("./entities/quiz_attempts.entity");
const websockets_1 = require("@nestjs/websockets");
let QuizService = class QuizService {
    constructor(qaService, quizRepo, quizAttemptRepo, questionAttemptRepo) {
        this.qaService = qaService;
        this.quizRepo = quizRepo;
        this.quizAttemptRepo = quizAttemptRepo;
        this.questionAttemptRepo = questionAttemptRepo;
        this.logger = new common_1.Logger('QuizService');
        this.getQuiz = async (id, relations = []) => {
            return await this.quizRepo.findOneOrFail(id, { relations });
        };
        this.createNewQuiz = async (user, quizData) => {
            const newQuiz = new quiz_entity_1.QuizEntity();
            newQuiz.startDatetime = new Date(quizData.startDatetime);
            newQuiz.endDatetime = new Date(quizData.endDatetime);
            newQuiz.createdBy = user;
            newQuiz.title = quizData.title;
            const questions = [];
            if (quizData.questions.length !== 0)
                for (let i of quizData.questions) {
                    questions.push(await this.qaService.createQuestion(user, i));
                }
            newQuiz.questions = questions;
            await newQuiz.save();
            return newQuiz;
        };
        this.addNewQuestion = async (user, question, quizId) => {
            const newQuestion = await this.qaService.createQuestion(user, question);
            const quiz = await this.quizRepo.findOne({ id: quizId }, { relations: ['createdBy'] });
            if (quiz.createdBy.id !== user.id) {
                throw new common_1.UnauthorizedException();
            }
            if (!quiz) {
                throw new common_1.BadRequestException('Invalid Quiz ID');
            }
            if (!quiz.questions) {
                quiz.questions = [];
            }
            quiz.questions.push(newQuestion);
            await quiz.save();
            return quiz;
        };
        this.addOldQuestion = async (user, questionId, quizId) => {
            const question = await this.qaService.findbyID(questionId);
            const quiz = await this.quizRepo.findOne({ id: quizId }, { relations: ['createdBy'] });
            if (!question || !quiz) {
                throw new common_1.BadRequestException('No Question/Quiz Found with the given ID');
            }
            if (!quiz.questions) {
                quiz.questions = [];
            }
            if (quiz.createdBy.id !== user.id) {
                throw new common_1.UnauthorizedException();
            }
            quiz.questions.push(question);
            await quiz.save();
            return quiz;
        };
        this.removeQuestion = async (user, questionId, quizId) => {
            const quiz = await this.quizRepo.findOne({ id: quizId }, { relations: ['createdBy'] });
            if (!quiz) {
                throw new common_1.BadRequestException('No Quiz Found with the given ID');
            }
            if (!quiz.questions) {
                quiz.questions = [];
            }
            if (quiz.createdBy.id !== user.id) {
                throw new common_1.UnauthorizedException();
            }
            quiz.questions = quiz.questions.filter(q => q.id !== questionId);
            await quiz.save();
            return quiz;
        };
        this.removeAllQuestions = async (user, quizId) => {
            const quiz = await this.quizRepo.findOne({ id: quizId }, { relations: ['createdBy'] });
            if (!quiz) {
                throw new common_1.BadRequestException('No Quiz Found with the given ID');
            }
            if (quiz.createdBy.id !== user.id) {
                throw new common_1.UnauthorizedException();
            }
            quiz.questions = [];
            await quiz.save();
            return quiz;
        };
        this.updateQuiz = async (user, quizId, startDatetime, endDatetime, title) => {
            const quiz = await this.quizRepo.findOne({ id: quizId }, { relations: ['createdBy'] });
            if (!quiz) {
                throw new common_1.BadRequestException('No Quiz Found with the given ID');
            }
            if (title) {
                quiz.title = title;
            }
            if (quiz.createdBy.id !== user.id) {
                throw new common_1.UnauthorizedException();
            }
            if (!startDatetime && !endDatetime) {
                throw new common_1.BadRequestException();
            }
            if (startDatetime)
                quiz.startDatetime = new Date(startDatetime);
            if (endDatetime)
                quiz.endDatetime = new Date(endDatetime);
            await quiz.save();
            return quiz;
        };
        this.deleteQuiz = async (id, userId) => {
            const quiz = await this.quizRepo.findOne(id, { relations: ['createdBy'] });
            console.log(quiz);
            if (!quiz) {
                throw new common_1.BadRequestException();
            }
            if (quiz.createdBy.id === userId) {
                await this.quizRepo.delete(id);
            }
            else {
                throw new common_1.UnauthorizedException();
            }
        };
        this.finishQuizAttempt = async (attemptId, user) => {
            const quizAttempt = await this.quizAttemptRepo.findOne(attemptId, {
                relations: ['user'],
            });
            if (user.id !== quizAttempt.user.id) {
                throw new websockets_1.WsException('Forbidden');
            }
            if (!quizAttempt) {
                throw new websockets_1.WsException('No Quiz Attempt Found');
            }
            quizAttempt.attemptFinished = true;
            quizAttempt.save();
        };
    }
    canAttemptQuiz(quiz, user, checkForPreviousAttempts = true) {
        const result = quiz &&
            quiz.startDatetime.getTime() < Date.now() &&
            quiz.endDatetime.getTime() > Date.now() &&
            (!checkForPreviousAttempts ||
                user.attempts.reduce((t, c) => {
                    if (quiz.id === c.quiz.id) {
                        return c.attemptFinished ? false : true;
                    }
                    else {
                        return t;
                    }
                }, true));
        this.logger.debug(result, 'canAttemptQuiz');
        return result;
    }
    async fetchQuestionForQuizAttempt(attemptId, questionNumber, user) {
        const quizAttempt = await this.quizAttemptRepo.findOne(attemptId, {
            relations: ['user'],
        });
        this.logger.debug(quizAttempt, 'fetchQuestionForQuizAttempt');
        if (this.canAttemptQuiz(quizAttempt.quiz, user, false) &&
            !quizAttempt.attemptFinished &&
            quizAttempt.user.id === user.id &&
            questionNumber >= 0 &&
            questionNumber < quizAttempt.quiz.questions.length) {
            const question = quizAttempt.quiz.questions[questionNumber];
            const selectedOption = quizAttempt.questionAttempts.reduce((t, c) => {
                if (question && c.questionId === question.id) {
                    return c.optionChoosed;
                }
                else {
                    return t;
                }
            }, undefined);
            this.logger.debug(question, `Question returned by fetchQuestionForQuizAttempt for Question Number - ${questionNumber}`);
            return { question, selectedOption };
        }
        else {
            throw new common_1.BadRequestException();
        }
    }
    async attemptQuiz(user, quizId) {
        const quiz = await this.quizRepo.findOne(quizId, {
            relations: ['attempts'],
        });
        const quizAttempt = user.attempts.reduce((t, c) => {
            if (c.quiz.id === quiz.id) {
                return c;
            }
            else {
                return t;
            }
        }, undefined);
        if (!this.canAttemptQuiz(quiz, user)) {
            throw new common_1.BadRequestException();
        }
        if (quizAttempt) {
            return quizAttempt.id;
        }
        const newQuizAttempt = new quiz_attempts_entity_1.QuizAttemptEntity();
        newQuizAttempt.user = user;
        newQuizAttempt.quiz = quiz;
        newQuizAttempt.questionAttempts = [];
        await newQuizAttempt.save();
        return newQuizAttempt.id;
    }
    async attemptQuestion(user, questionId, choosedOption, attemptId) {
        try {
            let isNew = false;
            const quizAttempt = await this.quizAttemptRepo.findOne(attemptId, {
                relations: [],
            });
            const question = await this.qaService.findbyID(questionId);
            if (!question ||
                !quizAttempt ||
                !this.canAttemptQuiz(quizAttempt.quiz, user, false)) {
                this.logger.error('Cannot Attempt Question');
                throw new common_1.BadRequestException();
            }
            let questionAttempt = await this.questionAttemptRepo.findOne({
                questionId,
                attempt: { id: quizAttempt.id },
            }, { relations: ['attempt'] });
            this.logger.debug({ question, quizAttempt, questionAttempt }, 'attemptQuestion()');
            if (!questionAttempt) {
                isNew = true;
                questionAttempt = new question_attempt_entity_1.QuestionAttemptEntity();
                this.logger.debug(question, "Question");
                questionAttempt.questionId = question.id;
                questionAttempt.attempt = quizAttempt;
            }
            else {
                quizAttempt.totalScore -=
                    questionAttempt.optionChoosed === question.correctAnswer ? 1 : 0;
            }
            questionAttempt.optionChoosed = choosedOption;
            if (isNew) {
                quizAttempt.questionAttempts.push(questionAttempt);
            }
            quizAttempt.totalScore +=
                questionAttempt.optionChoosed === question.correctAnswer ? 1 : 0;
            questionAttempt.save();
            quizAttempt.save();
        }
        catch (e) {
            console.log(e);
        }
    }
    async getQuizzes(user, options) {
        const q = this.quizRepo.createQueryBuilder('q');
        q.where('q.createdBy= :userId', { userId: user.id });
        q.orderBy('q.updatedAt', 'DESC');
        return await nestjs_typeorm_paginate_1.paginate(q, options);
    }
};
QuizService = __decorate([
    common_1.Injectable(),
    __param(1, typeorm_1.InjectRepository(quiz_repository_1.default)),
    __param(2, typeorm_1.InjectRepository(quiz_attempts_entity_1.QuizAttemptEntity)),
    __param(3, typeorm_1.InjectRepository(question_attempt_entity_1.QuestionAttemptEntity)),
    __metadata("design:paramtypes", [qa_service_1.QaService,
        quiz_repository_1.default,
        typeorm_2.Repository,
        typeorm_2.Repository])
], QuizService);
exports.QuizService = QuizService;
//# sourceMappingURL=quiz.service.js.map