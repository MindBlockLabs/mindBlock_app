# IQ Assessment Module

This module provides comprehensive IQ assessment functionality including question management, answer submission, and attempt tracking.

## Features

### 1. Answer Submission
- **Route**: `POST /iq-assessment/submit`
- **Description**: Submit answers for individual questions without requiring a session
- **Request Body**:
  ```json
  {
    "questionId": "uuid",
    "selectedAnswer": "string"
  }
  ```
- **Response**:
  ```json
  {
    "isCorrect": true,
    "correctAnswer": "string",
    "explanation": "string (optional)",
    "selectedAnswer": "string",
    "questionId": "uuid"
  }
  ```

### 2. Question Filtering
- **Route**: `GET /iq-assessment/questions/random`
- **Description**: Get random questions with optional filtering by difficulty and category
- **Query Parameters**:
  - `difficulty` (optional): `easy`, `medium`, `hard`
  - `category` (optional): `Science`, `Mathematics`, `Logic`, `Language`, `History`, `Geography`, `Literature`, `Art`, `Sports`, `Entertainment`, `General Knowledge`
  - `count` (optional): Number of questions to return (1-50, default: 1)
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "questionText": "string",
      "options": ["string"],
      "difficulty": "easy|medium|hard",
      "category": "string (optional)"
    }
  ]
  ```

### 3. Attempt Persistence
- All answer submissions are automatically logged in the `iq_attempts` table
- Supports both authenticated and anonymous users
- Provides analytics endpoints for attempt statistics

## Database Schema

### IQ Questions Table
```sql
CREATE TABLE iq_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty question_difficulty_enum NOT NULL DEFAULT 'medium',
  category question_category_enum
);
```

### IQ Attempts Table
```sql
CREATE TABLE iq_attempts (
  id UUID PRIMARY KEY,
  user_id UUID (nullable),
  question_id UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### Submit an Answer
```bash
curl -X POST http://localhost:3000/iq-assessment/submit \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "123e4567-e89b-12d3-a456-426614174001",
    "selectedAnswer": "32"
  }'
```

### Get Random Questions
```bash
# Get 5 easy math questions
curl "http://localhost:3000/iq-assessment/questions/random?difficulty=easy&category=Mathematics&count=5"

# Get 1 random question of any difficulty
curl "http://localhost:3000/iq-assessment/questions/random"
```

### Get User Attempt Statistics
```bash
curl "http://localhost:3000/iq-assessment/attempts/users/123e4567-e89b-12d3-a456-426614174000/stats"
```

## External API Integration

The module integrates with the Open Trivia Database API to fetch additional questions when the local database doesn't have enough questions matching the requested filters.

### Supported Categories Mapping
- Science → Science & Nature
- Mathematics → Mathematics
- History → History
- Geography → Geography
- Literature → Entertainment: Books
- Art → Art
- Sports → Sports
- Entertainment → Entertainment: Film
- General Knowledge → General Knowledge

## Performance Optimizations

- Database indexes on `difficulty`, `category`, and `(difficulty, category)` for fast filtering
- Options are shuffled before returning to prevent answer pattern recognition
- External API calls are cached and questions are stored locally for future use

## Testing

Run the tests with:
```bash
npm test -- --testPathPattern=iq-assessment
```

## Migration

To apply the database changes:
```bash
npm run migration:run
```

This will add the `difficulty` and `category` fields to existing questions with default values. 