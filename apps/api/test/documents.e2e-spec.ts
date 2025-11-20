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

describe('DocumentsController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const mockUser = {
    id: 1,
    username: 'user',
    passwordHash: 'hashed',
    isActive: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocument = {
    id: 1,
    documentNumber: 'DOC-2025-000001',
    documentType: 'invoice',
    customerId: 'cust-1',
    issueDate: new Date(), // Date object
    totalAmount: 100,
    finalAmount: 100,
    status: 'draft',
    approvalStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      name: 'John Doe',
    },
    createdBy: {
      username: 'user',
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // Enable transform for Date
    await app.init();

    // Setup auth
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'user', password: 'password' });
    
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/documents (GET)', () => {
    it('should return list of documents', async () => {
      mockPrismaService.document.findMany.mockResolvedValue([mockDocument]);
      mockPrismaService.document.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('documentNumber', 'DOC-2025-000001');
    });
  });

  describe('/documents (POST)', () => {
    it('should create a new document', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
      mockPrismaService.document.count.mockResolvedValue(0);
      mockPrismaService.document.create.mockResolvedValue(mockDocument);

      const createDto = {
        documentType: 'invoice',
        customerId: 'cust-1',
        issueDate: new Date().toISOString(),
        items: [
          {
            description: 'Item 1',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${token}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
