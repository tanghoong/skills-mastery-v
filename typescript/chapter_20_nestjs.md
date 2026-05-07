# Chapter 20: NestJS + TypeScript (Hour 20)

NestJS is the most popular TypeScript-first backend framework. It enforces strong architectural patterns and makes heavy use of decorators (Chapter 11) and dependency injection (Chapter 15).

## 1. Project Setup

```bash
npm install -g @nestjs/cli
nest new my-api
cd my-api
npm run start:dev
```

NestJS generates a fully configured TypeScript project with strict settings enabled.

## 2. Core Architecture

NestJS organises code into three main building blocks:

```
Module          ← organises related code together
  ├── Controller  ← handles incoming HTTP requests
  └── Service     ← contains business logic
```

Every NestJS application has a root `AppModule` that imports all feature modules.

## 3. Controllers

Controllers handle routing. Decorators define the HTTP method and path.

```typescript
// users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users") // base path: /users
export class UsersController {
    constructor(private readonly usersService: UsersService) {} // injected

    @Get()                               // GET /users
    findAll() {
        return this.usersService.findAll();
    }

    @Get(":id")                          // GET /users/:id
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Post()                              // POST /users
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(":id")                          // PUT /users/:id
    update(
        @Param("id", ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(":id")                       // DELETE /users/:id
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }
}
```

## 4. Data Transfer Objects (DTOs)

DTOs define the shape of incoming request bodies and enable automatic validation.

```typescript
// users/dto/create-user.dto.ts
import { IsString, IsEmail, IsInt, Min, Max, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsInt()
    @Min(18)
    @Max(120)
    age: number;

    @IsString()
    @IsOptional()
    role?: "admin" | "user";
}
```

```typescript
// users/dto/update-user.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

// PartialType makes every field optional — no manual duplication
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

Enable validation globally in `main.ts`:

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(3000);
}
bootstrap();
```

## 5. Services

Services hold business logic and are injectable via NestJS's DI system.

```typescript
// users/users.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    role: string;
}

@Injectable()
export class UsersService {
    private users: User[] = []; // In practice, use a database
    private nextId = 1;

    findAll(): User[] {
        return this.users;
    }

    findOne(id: number): User {
        const user = this.users.find(u => u.id === id);
        if (!user) throw new NotFoundException(`User #${id} not found`);
        return user;
    }

    create(dto: CreateUserDto): User {
        const user: User = { id: this.nextId++, role: "user", ...dto };
        this.users.push(user);
        return user;
    }

    update(id: number, dto: UpdateUserDto): User {
        const user = this.findOne(id);
        Object.assign(user, dto);
        return user;
    }

    remove(id: number): void {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) throw new NotFoundException(`User #${id} not found`);
        this.users.splice(index, 1);
    }
}
```

## 6. Modules

Modules group related controllers and services together.

```typescript
// users/users.module.ts
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
    controllers: [UsersController],
    providers:   [UsersService],
    exports:     [UsersService], // export if other modules need UsersService
})
export class UsersModule {}
```

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";

@Module({
    imports: [UsersModule],
})
export class AppModule {}
```

## 7. Guards — Authentication & Authorisation

Guards decide whether a request should proceed. They implement `CanActivate`.

```typescript
// auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(" ")[1];

        if (!token || token !== "valid-token") {
            throw new UnauthorizedException("Invalid token");
        }

        return true;
    }
}
```

```typescript
// Apply to a specific route or the whole controller
import { UseGuards } from "@nestjs/common";

@Controller("users")
@UseGuards(AuthGuard) // protects all routes in this controller
export class UsersController { /* ... */ }
```

## 8. Pipes — Transformation & Validation

Pipes transform or validate data before it reaches the controller.

```typescript
// Built-in pipes — ParseIntPipe, ParseUUIDPipe, ValidationPipe, DefaultValuePipe
@Get(":id")
findOne(@Param("id", ParseIntPipe) id: number) {
    // id is guaranteed to be a number — NestJS throws if conversion fails
    return this.usersService.findOne(id);
}

// Custom pipe
import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class PositiveIntPipe implements PipeTransform {
    transform(value: unknown): number {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
            throw new BadRequestException("Value must be a positive integer");
        }
        return num;
    }
}
```

## Action Item for Hour 20:

- Build a complete `ProductsModule` with:
  - `CreateProductDto` with validation decorators (name: string, price: number min 0, stock: number)
  - `ProductsController` with GET all, GET by id, POST, PATCH, DELETE
  - `ProductsService` with in-memory storage
  - An `AuthGuard` that reads a Bearer token from headers
  - Apply the guard to only the POST, PATCH, and DELETE routes
