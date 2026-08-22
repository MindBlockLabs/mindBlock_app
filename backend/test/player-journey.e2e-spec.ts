import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { SuperTest, Test as SupertestTest } from 'supertest';
import { App } from 'supertest/types';

import { PuzzleDifficulty } from '../src/puzzles/enums/puzzle-difficulty.enum';

const http = request as unknown as (app: App) => SuperTest<SupertestTest>;

interface AuthResponse {
	accessToken: string;
	user: { id: string; email: string; username: string };
}

interface PuzzleResponse {
	id: string;
	question: string;
	options: string[];
	correctAnswer: string;
	categoryId: string;
}

interface SessionResponse {
	id: string;
	status: string;
	challengeCount: number;
	score: number;
	xpEarned: number;
	accuracy: number | null;
	categoryPerformance: Array<{
		categoryId: string;
		total: number;
		correct: number;
	}> | null;
}

describe('Complete player journey (e2e)', () => {
	let app: INestApplication<App>;
	let auth: AuthResponse;

	beforeAll(async () => {
		// AppModule reads configuration while it is imported. Supplying a local
		// test default keeps this spec runnable when the developer has no .env.
		process.env.JWT_SECRET ??= 'player-journey-e2e-secret';

		const { AppModule } = await import('../src/app.module');
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			}),
		);
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	it('takes a new player from landing through session results', async () => {
		const unique = randomUUID().slice(0, 8);
		const email = `player-journey-${unique}@example.com`;
		const password = 'Journey123!';

		// Landing: the public entry point is available before authentication.
		await http(app.getHttpServer())
			.get('/')
			.expect(200)
			.expect('Hello World!');

		// Create the player and authenticate before entering onboarding.
		const registerResponse = await http(app.getHttpServer())
			.post('/auth/register')
			.send({
				email,
				username: `journey_${unique}`,
				password,
				passwordConfirm: password,
				fullname: 'Journey Player',
			})
			.expect(201);

		auth = registerResponse.body as AuthResponse;
		expect(auth.accessToken).toEqual(expect.any(String));
		expect(auth.user.id).toEqual(expect.any(String));

		const authorization = { Authorization: `Bearer ${auth.accessToken}` };

		// Onboarding: persist the selected difficulty and challenge category.
		const profileResponse = await http(app.getHttpServer())
			.patch(`/users/${auth.user.id}`)
			.set(authorization)
			.send({
				challengeLevel: 'beginner',
				challengeTypes: ['Logic Puzzle'],
				referralSource: 'Other',
				ageGroup: '18-24 years old',
			})
			.expect(200);

		expect(profileResponse.body.challengeLevel).toBe('beginner');
		expect(profileResponse.body.challengeTypes).toEqual(['Logic Puzzle']);

		// Select a category and create two isolated challenges for this run.
		const categoryResponse = await http(app.getHttpServer())
			.post('/categories')
			.set(authorization)
			.send({
				name: `Journey Logic ${unique}`,
				description: 'Category created by the player journey fixture',
				isActive: true,
			})
			.expect(201);

		const categoryId = categoryResponse.body.id as string;
		const createPuzzle = (question: string, answer: string) =>
			http(app.getHttpServer())
				.post('/puzzles')
				.set(authorization)
				.send({
					question,
					options: [answer, 'Not the answer'],
					correctAnswer: answer,
					difficulty: PuzzleDifficulty.BEGINNER,
					categoryId,
					points: 10,
					timeLimit: 60,
				})
				.expect(201);

		const firstPuzzle = (await createPuzzle(
			'Which value represents true in this challenge?',
			'true',
		)).body as PuzzleResponse;
		const secondPuzzle = (await createPuzzle(
			'Which value represents false in this challenge?',
			'false',
		)).body as PuzzleResponse;

		// Start game with the selected difficulty and category.
		const sessionResponse = await http(app.getHttpServer())
			.post('/game-sessions')
			.set(authorization)
			.send({
				challengeCount: 2,
				difficulty: PuzzleDifficulty.BEGINNER,
				selectedCategories: [categoryId],
			})
			.expect(201);

		const session = sessionResponse.body as SessionResponse;
		expect(session.status).toBe('CREATED');
		expect(session.challengeCount).toBe(2);

		await http(app.getHttpServer())
			.patch(`/game-sessions/${session.id}/status`)
			.set(authorization)
			.send({ status: 'ACTIVE' })
			.expect(200);

		// Receive challenge 1, submit it, and receive its graded result.
		const receivedFirst = await http(app.getHttpServer())
			.get(`/puzzles/${firstPuzzle.id}`)
			.set(authorization)
			.expect(200);
		expect(receivedFirst.body.options).toContain('true');

		const firstAttempt = await http(app.getHttpServer())
			.post('/challenge-attempts')
			.set(authorization)
			.send({
				userId: auth.user.id,
				challengeId: firstPuzzle.id,
				sessionId: session.id,
			})
			.expect(201);

		const firstResult = await http(app.getHttpServer())
			.post('/challenge-attempts/submit')
			.set(authorization)
			.send({
				attemptId: firstAttempt.body.id,
				answer: 'true',
				timeSpent: 5,
			})
			.expect(200);
		expect(firstResult.body.status).toBe('CORRECT');
		expect(firstResult.body.score).toBeGreaterThan(0);

		// Next challenge: load a new challenge and record its result as well.
		const receivedSecond = await http(app.getHttpServer())
			.get(`/puzzles/${secondPuzzle.id}`)
			.set(authorization)
			.expect(200);
		expect(receivedSecond.body.question).toContain('false');

		const secondAttempt = await http(app.getHttpServer())
			.post('/challenge-attempts')
			.set(authorization)
			.send({
				userId: auth.user.id,
				challengeId: secondPuzzle.id,
				sessionId: session.id,
			})
			.expect(201);

		const secondResult = await http(app.getHttpServer())
			.post('/challenge-attempts/submit')
			.set(authorization)
			.send({
				attemptId: secondAttempt.body.id,
				answer: 'not false',
				timeSpent: 7,
			})
			.expect(200);
		expect(secondResult.body.status).toBe('INCORRECT');

		// Complete the session and view the server-calculated results.
		const completionResponse = await http(app.getHttpServer())
			.patch(`/game-sessions/${session.id}/status`)
			.set(authorization)
			.send({ status: 'COMPLETED', userTimezone: 'UTC' })
			.expect(200);

		const completedSession = completionResponse.body as SessionResponse;
		expect(completedSession.status).toBe('COMPLETED');
		expect(completedSession.score).toBeGreaterThan(0);
		expect(completedSession.accuracy).toBe(50);

		const resultsResponse = await http(app.getHttpServer())
			.get(`/game-sessions/${session.id}`)
			.set(authorization)
			.expect(200);
		const results = resultsResponse.body as SessionResponse;
		expect(results.status).toBe('COMPLETED');
		expect(results.categoryPerformance).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					categoryId,
					total: 2,
					correct: 1,
				}),
			]),
		);
	});
});
