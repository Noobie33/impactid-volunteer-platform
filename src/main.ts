import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "@/common/filters/http-exception.filter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "@/src/app.module";
import * as dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", true);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Swagger UI needs 'unsafe-inline' to function correctly
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "validator.swagger.io"], // Allow Swagger images
          connectSrc: ["'self'"],
        },
      },
      // This policy can block Swagger assets, so we disable it for now
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 1. Logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    const now = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
    console.log(`[HTTP] [${now}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // 2. Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle("ImpactID REST API")
    .setDescription("Volunteer contribution verification and Impact Passport")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // 3. Cookie Parser
  if (process.env.COOKIE_SECRET) {
    app.use(cookieParser(process.env.COOKIE_SECRET));
  }

  // 4. CORS Configuration
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    maxAge: 86400,
  });

  await app.listen(Number(process.env.PORT ?? 5000));
}
bootstrap();
