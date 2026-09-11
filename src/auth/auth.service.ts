import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async register(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con ese correo electronico');
    }

    const user = await this.usersRepository.createAndSave({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    });
    return this.removePassword(user);
  }

  async login(dto: LoginDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException('Correo electronico o contraseña invalidos');
    }
    return this.removePassword(user);
  }

  private removePassword(user: User): Omit<User, 'password'> {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}