import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/../src/**/**/*.entity{.ts,.js}'], // Load all entities to resolve relationships
  synchronize: true,
  logging: false,
});
import { Category } from '../src/categories/entities/category.entity';

async function seedCategories() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const categoryRepository = AppDataSource.getRepository(Category);

    // Check if categories already exist
    const existingCategories = await categoryRepository.find();
    if (existingCategories.length > 0) {
      console.log('Categories already exist');
      return;
    }

    // Create sample categories
    const categories = [
      {
        name: 'Logic Puzzles',
        description: 'Challenge your reasoning and problem-solving skills',
        icon: '🧠',
        isActive: true,
      },
      {
        name: 'Coding Challenges',
        description: 'Test your programming and algorithm skills',
        icon: '💻',
        isActive: true,
      },
      {
        name: 'Blockchain Basics',
        description: 'Learn fundamental blockchain concepts',
        icon: '🔗',
        isActive: true,
      },
      {
        name: 'Mathematics',
        description: 'Solve mathematical problems and puzzles',
        icon: '🔢',
        isActive: true,
      },
      {
        name: 'Riddles',
        description: 'Classic and modern riddles to test your wit',
        icon: '🧩',
        isActive: true,
      },
    ];

    // Insert categories
    for (const categoryData of categories) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`Created category: ${category.name}`);
    }

    console.log('Categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedCategories();