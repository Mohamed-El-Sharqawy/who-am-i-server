# Configuration Module

## Overview
The Configuration Module provides a centralized, type-safe configuration management system for the "Who Am I?" game platform. It handles environment-specific configuration, validation, and access to configuration values throughout the application, ensuring consistent and secure configuration management.

## Features
- **Environment-Based Configuration**: Support for different environments (development, testing, production)
- **Type Safety**: Strongly typed configuration values with validation
- **Centralized Management**: Single source of truth for application configuration
- **Validation**: Configuration validation on application startup
- **Secure Handling**: Secure management of sensitive configuration values
- **Default Values**: Sensible defaults with override capability

## Acceptance Criteria
- Configuration is properly validated on application startup
- Environment variables are correctly loaded and typed
- Sensitive configuration is securely handled
- Configuration is accessible throughout the application
- Default values are provided for optional configuration
- Configuration errors provide clear, actionable messages

## Technical Implementation

### Architecture
- **Configuration Service**: Core service providing access to configuration values
- **Configuration Module**: NestJS module for configuration registration
- **Environment Schema**: Validation schema for environment variables
- **Configuration Interface**: Type definitions for configuration values

### Key Components

#### Configuration Service
- Provides access to typed configuration values
- Implements caching for performance optimization
- Handles environment-specific configuration loading

#### Environment Variables
- Database connection details
- JWT secrets and configuration
- Redis connection details
- External service API keys
- Logging configuration
- Server port and host settings

### Integration Points
- **All Modules**: Used throughout the application for configuration access
- **Main Application**: Initializes configuration on startup
- **Database Module**: Sources database connection configuration
- **Auth Module**: Sources JWT and authentication configuration
- **Cache Module**: Sources Redis connection configuration

### Technologies & Packages
- NestJS Configuration module
- Joi for schema validation
- dotenv for environment variable loading
- TypeScript for type safety

## Usage Examples

### Defining Configuration Schema
```typescript
// Server-side example
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
});
```

### Accessing Configuration Values
```typescript
// Server-side example
@Injectable()
export class SomeService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    // Use configuration values
  }
}
```

### Registering Configuration Module
```typescript
// Server-side example in app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: configValidationSchema,
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    // Other modules
  ],
})
export class AppModule {}
```

## Security Considerations
- Sensitive configuration values are never logged
- Environment variables are used for secure value storage
- Production configuration is separate from development
- Validation prevents missing critical configuration
- JWT secrets and API keys are properly secured

## Deployment Considerations
- Different environment files for development, testing, and production
- CI/CD pipeline sets appropriate environment variables
- Configuration validation runs before application starts
- Secure handling of production secrets through environment variables
