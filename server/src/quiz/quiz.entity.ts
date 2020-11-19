import { Exclude } from "class-transformer";
import QAEntity from "src/qa/qa.entity";
import UserEntity from "src/user/user.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class QuizEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column()
    startDatetime: Date;
    
    @Column()
    title: string;

    @Column()
    endDatetime:Date;

    @ManyToMany(type => QAEntity,{eager:true})
    @JoinTable()
    questions:QAEntity[]

    @ManyToOne(type => UserEntity,user=> user.quizzes,{eager:true})
    author:UserEntity;

    @Exclude()
    @ManyToOne(type => UserEntity,user=> user.attendedQuizzes,{eager:true,})
    participants: UserEntity[];
    
    @Exclude()
    @CreateDateColumn()
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn()
    updatedAt: Date;
}