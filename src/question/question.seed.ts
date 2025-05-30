import { DataSource } from 'typeorm';
import { Question } from './question.entity';

const mockQuestions: Partial<Question>[] = [
  {
    questionText: 'What comes next in the sequence: 3, 6, 12, 24, ?',
    options: ['30', '48', '36', '60'],
    correctAnswerIndex: 1,
    difficultyLevel: 'Easy',
    category: 'Logical Reasoning',
  },
  {
    questionText: 'Which figure is the odd one out?',
    options: ['Circle', 'Square', 'Triangle', 'Sphere'],
    correctAnswerIndex: 3,
    difficultyLevel: 'Medium',
    category: 'Visual Reasoning',
  },
  {
    questionText: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
    options: ['Yes', 'No', 'Maybe', 'Cannot determine'],
    correctAnswerIndex: 0,
    difficultyLevel: 'Medium',
    category: 'Deductive Reasoning',
  },
  {
    questionText: 'What is the missing number: 1, 4, 9, 16, ?, 36',
    options: ['20', '25', '30', '29'],
    correctAnswerIndex: 1,
    difficultyLevel: 'Easy',
    category: 'Number Pattern',
  },
  {
    questionText: 'John is twice as old as Mary was when John was as old as Mary is. If John is 24, how old is Mary?',
    options: ['12', '16', '18', '20'],
    correctAnswerIndex: 1,
    difficultyLevel: 'Hard',
    category: 'Mathematical Reasoning',
  },
];

export async function seedQuestions(dataSource: DataSource): Promise<void> {
  const questionRepo = dataSource.getRepository(Question);

  const count = await questionRepo.count();
  if (count > 0) {
    console.log('📌 Questions already exist. Skipping seeding.');
    return;
  }

  try {
    await questionRepo.save(mockQuestions);
    console.log(`✅ Successfully seeded ${mockQuestions.length} IQ questions.`);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
  }
}
