import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	// Enable CORS
	app.enableCors({
		// origin: configService.get('cors.origin') || true,
		origin: true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);

	// Swagger documentation
	const config = new DocumentBuilder()
		.setTitle('Who Am I - Game API')
		.setDescription('A comprehensive API for the "Who Am I" guessing game with real-time multiplayer support')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'JWT',
				description: 'Enter JWT token',
				in: 'header',
			},
			'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
		)
		// .addTag('Authentication', 'User registration, login, and profile management')
		// .addTag('Categories', 'Game categories and genres management')
		// .addTag('Cards', 'Game cards with random retrieval functionality')
		// .addTag('Rooms', 'Game room creation and management for 2 players')
		// .addServer('http://localhost:3000', 'Development server')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
		customSiteTitle: 'Who Am I API Documentation',
		customfavIcon: '/favicon.ico',
		customJs: [
			'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
		],
		customCssUrl: ['https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css'],
	});

	const port = configService.get('port') || 3000;
	await app.listen(port);

	console.log(`🚀 Who Am I API is running on: http://localhost:${port}`);
	console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
	console.log(`🎮 WebSocket endpoint: ws://localhost:${port}/game`);
}

bootstrap();
