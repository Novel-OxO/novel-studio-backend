import { Injectable } from '@nestjs/common';

import { Answer } from '@/domain/questions/answer';
import { NewAnswer } from '@/domain/questions/new-answer';
import { NewQuestion } from '@/domain/questions/new-question';
import { Question } from '@/domain/questions/question';
import { QuestionFilter, QuestionListResult, type IQuestionRepository } from '@/domain/questions/question.repository';
import { UpdateAnswer } from '@/domain/questions/update-answer';
import { UpdateQuestion } from '@/domain/questions/update-question';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaQuestionRepository implements IQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Question | null> {
    const question = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
    });
    return question ? this.toEntity(question) : null;
  }

  async findByCourseId(
    courseId: string,
    page: number,
    pageSize: number,
    filter?: QuestionFilter,
  ): Promise<QuestionListResult> {
    const skip = (page - 1) * pageSize;
    const where: any = { courseId, deletedAt: null };

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    const [questions, totalCount] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [filter?.sortBy || 'createdAt']: filter?.sortOrder || 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      questions: questions.map((q) => this.toEntity(q)),
      totalCount,
    };
  }

  async findByUserId(userId: string): Promise<Question[]> {
    const questions = await this.prisma.question.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return questions.map((q) => this.toEntity(q));
  }

  async save(newQuestion: NewQuestion): Promise<Question> {
    const created = await this.prisma.question.create({
      data: {
        title: newQuestion.title,
        content: newQuestion.content,
        userId: newQuestion.userId,
        courseId: newQuestion.courseId,
      },
    });
    return this.toEntity(created);
  }

  async update(updateQuestion: UpdateQuestion): Promise<Question> {
    const data: any = {};

    if (updateQuestion.title !== undefined) {
      data.title = updateQuestion.title;
    }
    if (updateQuestion.content !== undefined) {
      data.content = updateQuestion.content;
    }

    const updated = await this.prisma.question.update({
      where: { id: updateQuestion.id },
      data,
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findAnswerById(id: string): Promise<Answer | null> {
    const answer = await this.prisma.answer.findFirst({
      where: { id, deletedAt: null },
    });
    return answer ? this.toAnswerEntity(answer) : null;
  }

  async findAnswersByQuestionId(questionId: string): Promise<Answer[]> {
    const answers = await this.prisma.answer.findMany({
      where: { questionId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return answers.map((a) => this.toAnswerEntity(a));
  }

  async saveAnswer(newAnswer: NewAnswer): Promise<Answer> {
    const created = await this.prisma.answer.create({
      data: {
        content: newAnswer.content,
        userId: newAnswer.userId,
        questionId: newAnswer.questionId,
      },
    });
    return this.toAnswerEntity(created);
  }

  async updateAnswer(updateAnswer: UpdateAnswer): Promise<Answer> {
    const updated = await this.prisma.answer.update({
      where: { id: updateAnswer.id },
      data: { content: updateAnswer.content },
    });
    return this.toAnswerEntity(updated);
  }

  async deleteAnswer(id: string): Promise<void> {
    await this.prisma.answer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toEntity(question: any): Question {
    return new Question(
      question.id,
      question.title,
      question.content,
      question.userId,
      question.courseId,
      question.createdAt,
      question.updatedAt,
      question.deletedAt,
    );
  }

  private toAnswerEntity(answer: any): Answer {
    return new Answer(
      answer.id,
      answer.content,
      answer.userId,
      answer.questionId,
      answer.createdAt,
      answer.updatedAt,
      answer.deletedAt,
    );
  }
}
