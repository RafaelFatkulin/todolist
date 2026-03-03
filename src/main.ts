import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'nestjs-zod';
import { apiReference } from '@scalar/nestjs-api-reference';
import { NextFunction, Request, Response } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/docs')) {
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ['\'self\''],
            scriptSrc: [
              '\'self\'',
              'https://cdn.jsdelivr.net',
              '\'unsafe-inline\'',
            ],
            styleSrc: [
              '\'self\'',
              '\'unsafe-inline\'',
              'https://cdn.jsdelivr.net',
            ],
            imgSrc: ['\'self\'', 'data:', 'https:'],
            connectSrc: ['\'self\''],
            fontSrc: ['\'self\'', 'https://cdn.jsdelivr.net'],
            workerSrc: ['\'self\'', 'blob:'],
          },
        },
      })(req, res, next);
    } else {
      helmet()(req, res, next);
    }
  });
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('API').setVersion('1.0').addBearerAuth().build();
    const document = SwaggerModule.createDocument(app, config);

    app.use(
      '/docs',
      apiReference({
        content: document,
      }),
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
