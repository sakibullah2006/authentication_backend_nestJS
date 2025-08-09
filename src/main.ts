import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.use(cookieParser()); // <-- Enable cookie parsing

  app.enableCors({
    credentials: true, // IMPORTANT: This allows cookies to be sent
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
