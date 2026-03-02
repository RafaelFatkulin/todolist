import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) { }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('User with this email already exists');

    const passwordHash = await hash(dto.password, 12);
    const user = await this.userRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    this.logger.log(`User created: ${user.id}`);
    return toUserResponse(user);
  }

  async findAll(query: UserQueryDto): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll(query.limit, query.offset);
    return users.map(toUserResponse);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return toUserResponse(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundException(`User ${id} not found`);

    const data: UpdateUserDto = {};

    if (dto.password) {
      data.password = await hash(dto.password, 12);
    }

    const updated = await this.userRepository.update(id, data);
    if (!updated) throw new NotFoundException(`User ${id} not found`);

    return toUserResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.userRepository.deleteById(id);
    this.logger.log(`User deleted: ${id}`);
  }
}
