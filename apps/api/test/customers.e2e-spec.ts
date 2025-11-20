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

describe('CustomersController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const mockUser = {
    id: 1,
    username: 'admin',
    passwordHash: 'hashed',
    isActive: true,
    role: 'admin', // Lowercase to match @Roles('admin')
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer = {
    id: 1,
    code: 'CUST001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      documents: 0,
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

    // Setup auth for tests
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' });
    
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/customers (GET)', () => {
    it('should return list of customers', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('email', 'john@example.com');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .expect(401);
    });
  });

  describe('/customers (POST)', () => {
    it('should create a new customer', async () => {
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const createDto = {
        code: 'CUST001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createDto.email);
    });
  });

  describe('/customers/:id (GET)', () => {
    it('should return a customer by id', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const response = await request(app.getHttpServer())
        .get('/customers/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
    });

    it('should return 404 if customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/customers/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
