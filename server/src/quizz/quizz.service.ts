import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import NewQuestionDto from '../question/dto/new.question';
import QAEntity from '../question/question.entity';
import { QuestionService } from '../question/question.service';
import UserEntity from '../user/user.entity';
import { Repository } from 'typeorm';
import { NewQuizDto } from './dto/new.quiz';
import { UpdateQuizDto } from './dto/update.quizz';
import { QuestionAttemptEntity } from './entities/question_attempt.entity';
import { QuizzEntity } from './entities/quizz.entity';

import QuizzAttemptEntity from './entities/quizz_attempts.entity';
import { WsException } from '@nestjs/websockets';
import QuestionEntity from '../question/question.entity';

@Injectable()
export class QuizzService {
  constructor(
    private questionService: QuestionService,
    @InjectRepository(QuizzEntity)
    private quizRepo: Repository<QuizzEntity>,
    @InjectRepository(QuizzAttemptEntity)
    private quizAttemptRepo: Repository<QuizzAttemptEntity>,
    @InjectRepository(QuestionAttemptEntity)
    private questionAttemptRepo: Repository<QuestionAttemptEntity>,
  ) {}

  private logger: Logger = new Logger('QuizzService');

  canAttemptQuiz(
    quiz: QuizzEntity,
    user: UserEntity,
    checkForPreviousAttempts: boolean = true,
  ) {
    const result =
      quiz &&
      quiz.startDatetime.getTime() < Date.now() &&
      quiz.endDatetime.getTime() > Date.now() &&
      (!checkForPreviousAttempts ||
        user.userQuizAttempts.reduce((t, c) => {
          if (quiz.quizzId === c.quizz.quizzId) {
            return !c.attemptFinished;
          } else {
            return t;
          }
        }, true));

    this.logger.debug(result, 'canAttemptQuiz');
    return result;
  }

  async fetchQuizzDetails(user: UserEntity, quizzId: string) {
    let quizz: QuizzEntity;
    try {
      quizz = await this.getQuiz(quizzId, ['createdBy']);
    } catch {
      throw new NotFoundException('Quizz Not Found');
    }

    const data = {
      ...quizz,
      canAttemptQuizz:
        this.canAttemptQuiz(quizz, user) &&
        quizz.createdBy.userId !== user.userId,
      totalNumberOfQuestions: quizz.questions.length,
      isQuizzAttemptFinished: user.userQuizAttempts.reduce((t, c) => {
        if (c.quizz.quizzId === quizzId) {
          return c.attemptFinished || quizz.endDatetime.getTime() < Date.now()
            ? true
            : false;
        } else {
          return t;
        }
      }, false),
    };

    return data;
  }

  async fetchQuizzResults(user: UserEntity, quizzId: string) {
    try {
      const quizzAttempt = user.userQuizAttempts.reduce((t, c) => {
        if (c.quizz.quizzId === quizzId) {
          return c;
        } else return t;
      }, undefined);

      if (!quizzAttempt) {
        throw new BadRequestException('Quizz Not Found');
      }

      if (quizzAttempt.quizz.endDatetime.getTime() > Date.now()) {
        throw new BadRequestException(
          'Quizz has not ended Yet. You can only see the results after the Quizz has ended',
        );
      }

      const questions = quizzAttempt?.quizz?.questions;
      const cacheQuestion: {
        [key: string]: number; // index
      } = {};

      for (let i = 0; i < questions?.length; i++) {
        cacheQuestion[questions[i].questionId] = i;
      }

      const questions_ = quizzAttempt?.questionAttempts.map((o, index) => {
        return {
          optionChoosed: o?.optionChoosed,
          question: questions[cacheQuestion[o?.questionId]],
        };
      });

      return {
        score: quizzAttempt.totalScore,
        maxScore: questions.length,
        questions: questions_,
      };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
  }

  async fetchQuestionForQuizAttempt(
    attemptId: string,
    questionNumber: number,
    user: UserEntity,
  ) {
    const quizAttempt = await this.quizAttemptRepo.findOne(attemptId, {
      relations: ['user'],
    });

    this.logger.debug(quizAttempt, 'fetchQuestionForQuizAttempt');
    if (
      this.canAttemptQuiz(quizAttempt.quizz, user, false) &&
      !quizAttempt.attemptFinished &&
      quizAttempt.user.userId === user.userId &&
      questionNumber >= 0 &&
      questionNumber < quizAttempt.quizz.questions.length
    ) {
      const question = quizAttempt.quizz.questions[questionNumber];
      const selectedOption = quizAttempt.questionAttempts.reduce((t, c) => {
        if (question && c.questionId === question.questionId) {
          return c.optionChoosed;
        } else {
          return t;
        }
      }, undefined);
      this.logger.debug(
        question,
        `Question returned by fetchQuestionForQuizAttempt for Question Number - ${questionNumber}`,
      );
      return { question, selectedOption };
    } else {
      throw new BadRequestException();
    }
  }

  async attemptQuiz(user: UserEntity, quizId: string): Promise<string> {
    const quiz = await this.quizRepo.findOne(quizId, {
      relations: ['quizzAttemptsByUsers', 'createdBy'],
    });
    const quizAttempt = user.userQuizAttempts.reduce((t, c) => {
      if (c.quizz.quizzId === quiz.quizzId) {
        return c;
      } else {
        return t;
      }
    }, undefined);

    if (
      !this.canAttemptQuiz(quiz, user) ||
      quiz.createdBy.userId === user.userId
    ) {
      throw new BadRequestException();
    }

    if (quizAttempt) {
      return quizAttempt.quizzAttemptId;
    }

    const newQuizAttempt = new QuizzAttemptEntity();
    newQuizAttempt.user = user;
    newQuizAttempt.quizz = quiz;
    newQuizAttempt.questionAttempts = [];
    await newQuizAttempt.save();
    this.logger.debug(newQuizAttempt, '[new attemptQuiz]');
    return newQuizAttempt.quizzAttemptId;
  }

  async attemptQuestion(
    user: UserEntity,
    questionId: string,
    choosedOption: string,
    attemptId: string,
  ) {
    try {
      let isNew = false;
      const quizAttempt = await this.quizAttemptRepo.findOne(attemptId, {
        relations: [],
      });
      const question = await this.questionService.findbyID(questionId);

      if (
        !question ||
        !quizAttempt ||
        !this.canAttemptQuiz(quizAttempt.quizz, user, false)
      ) {
        this.logger.error('Cannot Attempt Question');
        throw new BadRequestException();
      }
      let questionAttempt = await this.questionAttemptRepo.findOne(
        {
          questionId,
          quizAttempt: { quizzAttemptId: quizAttempt.quizzAttemptId },
        },
        { relations: ['quizAttempt'] },
      );

      this.logger.debug(
        { question, quizAttempt, questionAttempt },
        'attemptQuestion()',
      );

      if (!questionAttempt) {
        isNew = true;
        questionAttempt = new QuestionAttemptEntity();
        this.logger.debug(question, 'Question');
        questionAttempt.questionId = question.questionId;
        questionAttempt.quizAttempt = quizAttempt;
      } else {
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
    } catch (e) {
      console.log(e);
    }
  }

  getQuiz = async (id: string, relations: string[] = []) => {
    return await this.quizRepo.findOneOrFail(id, { relations });
  };

  getQuizzAttemptData = async (
    quizzId: string,
    user: UserEntity,
    options: IPaginationOptions,
  ) => {

    const quizz = await this.getQuiz(quizzId, ['createdBy']);
    
    if (!quizz || quizz?.createdBy?.userId !== user.userId) {
      throw new BadRequestException();
    }

    const q = this.quizAttemptRepo.createQueryBuilder('q');
    q.andWhere('q.quizz.quizzId= :quizzId', { quizzId });
    q.orderBy('q.totalScore', 'DESC');
    q.leftJoinAndSelect('q.user', 'user');


    const data = await paginate<QuizzAttemptEntity>(q, options);
    console.log(data);
    return data;
  };

  createNewQuiz = async (user: UserEntity, quizData: NewQuizDto) => {
    const newQuiz = new QuizzEntity();

    newQuiz.startDatetime = new Date(quizData.startDatetime);
    newQuiz.endDatetime = new Date(quizData.endDatetime);
    newQuiz.createdBy = user;
    newQuiz.quizzTitle = quizData.quizzTitle;

    const questions: QAEntity[] = [];
    if (quizData.questions.length !== 0)
      for (let i of quizData.questions) {
        questions.push(await this.questionService.createNewQuestion(user, i));
      }
    newQuiz.questions = questions;
    await newQuiz.save();
    return newQuiz;
  };

  updateQuizz = async (
    user: UserEntity,
    quizzData: UpdateQuizDto,
    quizzId: string,
  ) => {
    const { endDatetime, questions, quizzTitle, startDatetime } = quizzData;

    const quizz = await this.getQuiz(quizzId, ['createdBy']);

    if (!quizz || quizz.createdBy.userId !== user.userId) {
      throw new BadRequestException();
    }

    if (endDatetime) {
      quizz.endDatetime = new Date(endDatetime);
    }

    if (startDatetime) {
      quizz.startDatetime = new Date(startDatetime);
    }

    if (quizzTitle) {
      quizz.quizzTitle = quizzTitle;
    }

    if (questions) {
      const newQuestions: QuestionEntity[] = [];
      for (let question of questions) {
        if (question.questionId) {
          await this.questionService.updateQuestion(
            user,
            question,
            question.questionId,
          );
        } else {
          const newQuestion = await this.questionService.createNewQuestion(
            user,
            question as NewQuestionDto,
          );
          newQuestions.push(newQuestion);
        }
      }
      quizz.questions = [...quizz.questions, ...newQuestions];
    }

    await quizz.save();
  };

  addNewQuestion = async (
    user: UserEntity,
    question: NewQuestionDto,
    quizzId: string,
  ) => {
    const newQuestion = await this.questionService.createNewQuestion(
      user,
      question,
    );

    const quiz = await this.quizRepo.findOne(
      { quizzId },
      { relations: ['createdBy'] },
    );

    if (quiz.createdBy.userId !== user.userId) {
      throw new UnauthorizedException();
    }

    if (!quiz) {
      throw new BadRequestException('Invalid Quiz ID');
    }

    if (!quiz.questions) {
      quiz.questions = [];
    }

    quiz.questions.push(newQuestion);
    await quiz.save();
    return quiz;
  };

  addOldQuestion = async (
    user: UserEntity,
    questionId: string,
    quizzId: string,
  ) => {
    const question = await this.questionService.findbyID(questionId);
    const quiz = await this.quizRepo.findOne(
      { quizzId },
      { relations: ['createdBy'] },
    );
    if (!question || !quiz) {
      throw new BadRequestException('No Question/Quiz Found with the given ID');
    }
    if (!quiz.questions) {
      quiz.questions = [];
    }

    if (quiz.createdBy.userId !== user.userId) {
      throw new UnauthorizedException();
    }
    quiz.questions.push(question);

    await quiz.save();
    return quiz;
  };

  removeQuestion = async (
    user: UserEntity,
    questionId: string,
    quizzId: string,
  ) => {
    const quiz = await this.quizRepo.findOne(
      { quizzId },
      { relations: ['createdBy'] },
    );
    if (!quiz) {
      throw new BadRequestException('No Quiz Found with the given ID');
    }
    if (!quiz.questions) {
      quiz.questions = [];
    }

    if (quiz.createdBy.userId !== user.userId) {
      throw new UnauthorizedException();
    }

    quiz.questions = quiz.questions.filter(q => q.questionId !== questionId);

    await quiz.save();
    return quiz;
  };

  removeAllQuestions = async (user: UserEntity, quizzId: string) => {
    const quiz = await this.quizRepo.findOne(
      { quizzId },
      { relations: ['createdBy'] },
    );
    if (!quiz) {
      throw new BadRequestException('No Quiz Found with the given ID');
    }

    if (quiz.createdBy.userId !== user.userId) {
      throw new UnauthorizedException();
    }

    quiz.questions = [];
    await quiz.save();
    return quiz;
  };

  async getQuizzes(user: UserEntity, options: IPaginationOptions) {
    const q = this.quizRepo.createQueryBuilder('q');
    q.where('q.createdBy= :userId', { userId: user.userId });
    q.orderBy('q.updatedAt', 'DESC');

    return await paginate<QuizzEntity>(q, options);
  }

  deleteQuiz = async (quizzId: string, userId: string) => {
    const quiz = await this.quizRepo.findOne(quizzId, {
      relations: ['createdBy'],
    });

    if (!quiz) {
      throw new BadRequestException();
    }
    console.debug(quiz.createdBy.userId, userId);

    if (quiz.createdBy.userId === userId) {
      await this.quizRepo.delete(quizzId);
    } else {
      throw new UnauthorizedException();
    }
  };

  finishQuizAttempt = async (attemptId: string, user: UserEntity) => {
    const quizAttempt = await this.quizAttemptRepo.findOne(attemptId, {
      relations: ['user'],
    });
    if (user.userId !== quizAttempt.user.userId) {
      throw new WsException('Forbidden');
    }
    if (!quizAttempt) {
      throw new WsException('No Quiz Attempt Found');
    }
    quizAttempt.attemptFinished = true;
    quizAttempt.save();
  };
}
