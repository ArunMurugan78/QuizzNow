import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Delete,
  Patch,
  Get,
  Query
} from '@nestjs/common';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import JwtGaurd from '../auth/jwt.gaurd';
import NewQuestionDto from '../question/dto/new.question';
import { NewQuizDto } from './dto/new.quiz';
import { QuizzService } from './quizz.service';

@Controller('quizz')
export class QuizController {
  constructor(private quizService: QuizzService) {}

  @Post('new')
  @UseGuards(JwtGaurd)
  @UsePipes(ValidationPipe)
  async newQuiz(@Body() data: NewQuizDto, @Req() req, @Res() res) {
   await this.quizService.createNewQuiz(req.user, data);
  return res.sendStatus(HttpStatus.CREATED);
  }


  @Post(':qid/question/new')
  @UseGuards(JwtGaurd)
  @UsePipes(ValidationPipe)
  async newQuestion(
    @Body() questionData: NewQuestionDto,
    @Param('qid') quizId: string,
    @Req() req,
    @Res() res,
  ) {
    await this.quizService.addNewQuestion(req.user, questionData, quizId);
    return res.sendStatus(HttpStatus.CREATED);
  }

  @Delete(':qid/question/:questionID')
  @UseGuards(JwtGaurd)
  @UsePipes(ValidationPipe)
  async removeQuestion(
    @Param('questionID') questionID: string,
    @Param('qid') quizId: string,
    @Req() req,
    @Res() res,
  ) {
    await this.quizService.removeQuestion(req.user, questionID, quizId);
    return res.sendStatus(HttpStatus.OK);
  }

  @Delete(':qid/all/questions')
  @UseGuards(JwtGaurd)
  @UsePipes(ValidationPipe)
  async removeAllQuestions(
    @Param('qid') quizId: string,
    @Req() req,
    @Res() res,
  ) {
    await this.quizService.removeAllQuestions(req.user, quizId);
    return res.sendStatus(HttpStatus.OK);
  }

  @Patch(':qid')
  @UseGuards(JwtGaurd)
  @UsePipes(ValidationPipe)
  async updateQuizTime(
    @Body('startDatetime') startDatetime: string,
    @Body('endDatetime') endDatetime: string,
    @Param('qid') quizId,
    @Req() req,
    @Res() res,
  ) {
    await this.quizService.updateQuiz(req.user,quizId,startDatetime,endDatetime );
    return res.sendStatus(HttpStatus.OK);
  }

  @Get()
  @UseGuards(JwtGaurd)
  async get(@Query() options: IPaginationOptions, @Req() req) {
   
    return await  this.quizService.getQuizzes(req.user, options);
  }

  @Delete(':id')
  @UseGuards(JwtGaurd)
  async deleteQuiz(@Param('id') id:string,@Req() req,@Res() res) {
    await this.quizService.deleteQuiz(id, req.user.id);
    return res.sendStatus(HttpStatus.OK);
  }

}
