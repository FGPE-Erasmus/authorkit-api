import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import * as csurf from 'csurf';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

import { AppModule } from './modules/main/app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);
  app.enableCors();
  app.use(helmet());
  /* app.use(csurf()); */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use( // limit each IP to 250 requests per 15 minutes
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 250,
      message:
        'Too many requests from this IP, please try again later',
    }),
  );
  app.use( // limit each IP to 10 email signup requests per hour
    '/auth/register',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 10,
      message:
        'Too many accounts created from this IP, please try again after an hour',
    }),
  );
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
