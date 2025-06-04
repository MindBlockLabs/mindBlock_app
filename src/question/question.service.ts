import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './question.entity';
import { TestSession } from '../test-session/test-session.entity';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,

    @InjectRepository(TestSession)
    private readonly sessionRepo: Repository<TestSession>,
  ) {}

  async getUniqueShuffledQuestions(userId: number, count = 8): Promise<Question[]> {
    const allQuestions = await this.questionRepo.find();
    const previousSessions = await this.sessionRepo.find({ where: { userId } });

    const usedOrders = new Set(previousSessions.map(s => s.questionIds.join(',')));

    let attempts = 0;
    let shuffled: Question[] = [];

    do {
      shuffled = this.shuffleArray([...allQuestions]).slice(0, count);
      const ids = shuffled.map(q => q.id).join(',');
      if (!usedOrders.has(ids)) {
        // Save session
        await this.sessionRepo.save({ userId, questionIds: shuffled.map(q => q.id) });
        return shuffled;
      }
      attempts++;
    } while (attempts < 10);

    
    console.warn(`⚠️ Could not find a unique order after ${attempts} attempts. Returning fallback.`);
    const fallback = this.shuffleArray([...allQuestions]).slice(0, count);
    await this.sessionRepo.save({ userId, questionIds: fallback.map(q => q.id) });
    return fallback;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
