import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { DatabaseService } from './database.service';
import { UsersEntity } from './entities/users.entity';

@Controller('database')
export class DatabaseController {
  constructor(private readonly userService: DatabaseService) {}

  @Get()
  async findAll(): Promise<UsersEntity[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<UsersEntity> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() user: UsersEntity): Promise<UsersEntity> {
    return this.userService.create(user);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() user: UsersEntity): Promise<void> {
    return this.userService.update(id, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.userService.delete(id);
  }
}
