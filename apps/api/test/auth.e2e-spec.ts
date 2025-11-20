import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    id: 1,
    username: 'testuser',
    passwordHash: '$2b$10$EpIxT98hP7v.q.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x', // Mock hash
    isActive: true,
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return JWT token for valid credentials', async () => {
      // Mock bcrypt.compare to return true
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should return 401 for invalid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'nonexistent', password: 'password123' })
        .expect(401);
    });

    it('should return 400 for invalid input (short password)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'testuser', password: '123' })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user profile', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // First login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(201);

      const token = loginResponse.body.token;

      // Then get profile
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('role', 'USER');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
