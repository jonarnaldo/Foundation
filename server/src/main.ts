import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import helmet from 'helmet'
import * as compression from 'compression'
import { readFileSync } from 'fs'

async function bootstrap() {
  // Load API key from file if env var not set
  if (!process.env.ANTHROPIC_API_KEY) {
    try {
      process.env.ANTHROPIC_API_KEY = readFileSync('/tmp/api-key', 'utf-8').trim()
    } catch {
      // Key file not available — Claude features will be unavailable
    }
  }

  const app = await NestFactory.create(AppModule)

  app.use(helmet())
  app.use(compression())

  app.setGlobalPrefix('api')
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )

  const config = new DocumentBuilder()
    .setTitle('Foundation API')
    .setDescription('Construction Finance Orchestration API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`Foundation API running on http://localhost:${port}/api`)
  console.log(`Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
