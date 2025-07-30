import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (development and production)
  app.enableCors({
    origin: [
      'http://localhost:4200', 
      'http://127.0.0.1:4200',
      'https://send-it-mauve.vercel.app', // Actual Vercel frontend URL
      'https://sendit-frontend.vercel.app', // Alternative Vercel URL
      'https://sendit-frontend-git-main.vercel.app', // Vercel preview URL
      /\.vercel\.app$/, // All Vercel subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
