import type { DataSource } from "typeorm"
import { IQQuestion } from "../entities/iq-question.entity"

const iqQuestions: Partial<IQQuestion>[] = [
  {
    questionText: "What comes next in the sequence: 2, 6, 18, 54, ?",
    options: ["108", "162", "216", "324"],
    correctAnswer: "162",
    explanation: "Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162",
  },
  {
    questionText: "Which number is missing: 1, 4, 9, 16, ?, 36",
    options: ["20", "25", "30", "32"],
    correctAnswer: "25",
    explanation: "These are perfect squares: 1², 2², 3², 4², 5², 6². So 5² = 25",
  },
  {
    questionText: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
    options: ["Yes", "No", "Maybe", "Cannot determine"],
    correctAnswer: "Yes",
    explanation: "This is a logical syllogism. If A→B and B→C, then A→C. All Bloops are Lazzies.",
  },
  {
    questionText: "What is the next number: 3, 7, 15, 31, ?",
    options: ["47", "63", "79", "95"],
    correctAnswer: "63",
    explanation: "Pattern: multiply by 2 and add 1. 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63",
  },
  {
    questionText: "Which word does not belong: Apple, Orange, Banana, Carrot, Grape",
    options: ["Apple", "Orange", "Banana", "Carrot"],
    correctAnswer: "Carrot",
    explanation: "Carrot is a vegetable, while all others are fruits.",
  },
  {
    questionText: "Complete the analogy: Book is to Reading as Fork is to ?",
    options: ["Kitchen", "Eating", "Metal", "Spoon"],
    correctAnswer: "Eating",
    explanation: "A book is used for reading, just as a fork is used for eating.",
  },
  {
    questionText: "What comes next: A, D, G, J, ?",
    options: ["K", "L", "M", "N"],
    correctAnswer: "M",
    explanation: "Each letter is 3 positions ahead in the alphabet: A(+3)→D(+3)→G(+3)→J(+3)→M",
  },
  {
    questionText: "If 5 machines make 5 widgets in 5 minutes, how long does it take 100 machines to make 100 widgets?",
    options: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"],
    correctAnswer: "5 minutes",
    explanation: "Each machine makes 1 widget in 5 minutes, so 100 machines make 100 widgets in 5 minutes.",
  },
  {
    questionText: "Which shape completes the pattern: Circle, Square, Triangle, Circle, Square, ?",
    options: ["Circle", "Square", "Triangle", "Rectangle"],
    correctAnswer: "Triangle",
    explanation: "The pattern repeats every 3 shapes: Circle, Square, Triangle, Circle, Square, Triangle.",
  },
  {
    questionText: "What is the missing number: 8, 27, 64, ?, 216",
    options: ["100", "125", "144", "169"],
    correctAnswer: "125",
    explanation: "These are perfect cubes: 2³=8, 3³=27, 4³=64, 5³=125, 6³=216",
  },
  {
    questionText: 'If you rearrange the letters "CIFAIPC", you would have the name of a(n):',
    options: ["Ocean", "Country", "City", "Animal"],
    correctAnswer: "Ocean",
    explanation: "CIFAIPC rearranged spells PACIFIC, which is an ocean.",
  },
  {
    questionText: "What number should replace the question mark: 2, 5, 11, 23, ?",
    options: ["35", "41", "47", "53"],
    correctAnswer: "47",
    explanation: "Pattern: multiply by 2 and add 1. 2×2+1=5, 5×2+1=11, 11×2+1=23, 23×2+1=47",
  },
  {
    questionText: "Which number is the odd one out: 3, 5, 11, 14, 17, 21",
    options: ["3", "5", "14", "17"],
    correctAnswer: "14",
    explanation: "14 is the only even number; all others (3, 5, 11, 17, 21) are odd.",
  },
  {
    questionText: "Complete the series: 1, 1, 2, 3, 5, 8, ?",
    options: ["11", "13", "15", "21"],
    correctAnswer: "13",
    explanation: "This is the Fibonacci sequence where each number is the sum of the two preceding ones: 5+8=13",
  },
  {
    questionText: "If MONDAY is coded as ONMYAD, how is FRIDAY coded?",
    options: ["IRFDYA", "RFIDYA", "IRDAYF", "FRIDYA"],
    correctAnswer: "IRFDYA",
    explanation: "The pattern swaps pairs of letters: MO→ON, ND→MY, AY→AD. So FR→IR, ID→FD, AY→YA = IRFDYA",
  },
]

export async function seedIQQuestions(dataSource: DataSource): Promise<void> {
  const questionRepo = dataSource.getRepository(IQQuestion)

  const count = await questionRepo.count()
  if (count > 0) {
    console.log("📌 IQ Questions already exist. Skipping seeding.")
    return
  }

  try {
    await questionRepo.save(iqQuestions)
    console.log(`✅ Successfully seeded ${iqQuestions.length} IQ questions.`)
  } catch (error) {
    console.error("❌ Error seeding IQ questions:", error)
  }
}
