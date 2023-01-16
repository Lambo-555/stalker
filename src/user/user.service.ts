import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UsersEntity } from './entities/users.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
  ) {}

  async findAll(): Promise<UsersEntity[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<UsersEntity> {
    return this.userRepository.findOne({ where: { id: id } });
  }

  async create(user: UsersEntity): Promise<UsersEntity> {
    return this.userRepository.save(user);
  }

  async update(id: number, user: UsersEntity): Promise<void> {
    await this.userRepository.update(id, user);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  // async findAllRegistered(): Promise<Users[]> {
  //   return this.userRepository.find({ where: { telegramId: Not(IsNull()) } });
  // }

  // async findOneByTelegramId(telegramId: number): Promise<Users> {
  //   return this.userRepository.findOne({ where: { telegramId: telegramId } });
  // }

  // async updateByTelegramId(telegramId: number, user: Users): Promise<void> {
  //   await this.userRepository.update({ telegramId: telegramId }, user);
  // }

  // async deleteByTelegramId(telegramId: number): Promise<void> {
  //   await this.userRepository.delete(telegramId);
  // }
}
