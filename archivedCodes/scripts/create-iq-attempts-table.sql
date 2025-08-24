-- Create the iq_attempts table for logging user responses
CREATE TABLE IF NOT EXISTS iq_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    "questionId" UUID NOT NULL REFERENCES iq_questions(id) ON DELETE CASCADE,
    "selectedAnswer" VARCHAR(500) NOT NULL,
    "correctAnswer" VARCHAR(500) NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_iq_attempts_user_id ON iq_attempts("userId");
CREATE INDEX IF NOT EXISTS idx_iq_attempts_question_id ON iq_attempts("questionId");
CREATE INDEX IF NOT EXISTS idx_iq_attempts_created_at ON iq_attempts("createdAt");
CREATE INDEX IF NOT EXISTS idx_iq_attempts_is_correct ON iq_attempts("isCorrect");

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_iq_attempts_user_created ON iq_attempts("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_iq_attempts_question_created ON iq_attempts("questionId", "createdAt" DESC);
