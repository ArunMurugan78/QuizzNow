import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import UserEntity from './user/user.entity';
import { QuizService } from './quiz/quiz.service';
export declare class QuizAttemptGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private quizService;
    constructor(quizService: QuizService);
    server: Server;
    private logger;
    afterInit(): void;
    handleDisconnect(client: Socket): void;
    handleConnection(client: Socket, ...args: any[]): void;
    fetchQuizDetails(server: Server, data: {
        payload: string;
        user: UserEntity;
    }): void;
}
