import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { QuestionModule } from './question/question.module';
import { QuizzModule } from './quizz/quizz.module';
import { QuizAttemptGateway } from './quizz/quizz-attempt.gateway';
import TypeOrmConfig from '../config/typeorm.config';
import { QuestionController } from './question/question.controller';
import { QuizController } from './quizz/quizz.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(TypeOrmConfig),
    AuthModule,
    UserModule,
    QuestionModule,
    QuizzModule,
  ],
  controllers: [AuthController,QuestionController,QuizController],
  providers: [QuizAttemptGateway],
})
export class AppModule {}
