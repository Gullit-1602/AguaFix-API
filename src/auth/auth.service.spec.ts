import * as bcrypt from 'bcryptjs';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/repositories/users.repository';

describe('AuthService', () => {
  const usersRepository = {
    findByEmail: jest.fn(),
    createAndSave: jest.fn(),
  } as unknown as UsersRepository;
  const authService = new AuthService(usersRepository);

  beforeEach(() => jest.clearAllMocks());

  it('registers a user with a hashed password and hides it in the response', async () => {
    usersRepository.findByEmail = jest.fn().mockResolvedValue(null);
    usersRepository.createAndSave = jest.fn().mockImplementation((user) =>
      Promise.resolve({ id: 1, ...user, isNotificationEnabled: true }),
    );

    const result = await authService.register({
      name: 'Operador',
      email: 'operador@municipio.gob',
      password: 'clave-segura',
    });

    expect(result).not.toHaveProperty('password');
    expect(usersRepository.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'operador@municipio.gob' }),
    );
    const savedUser = (usersRepository.createAndSave as jest.Mock).mock.calls[0][0];
    expect(savedUser.password).not.toBe('clave-segura');
    await expect(bcrypt.compare('clave-segura', savedUser.password)).resolves.toBe(true);
  });

  it('rejects invalid login credentials with a clear bad request', async () => {
    usersRepository.findByEmail = jest.fn().mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nadie@municipio.gob', password: 'incorrecta' }),
    ).rejects.toThrow(new BadRequestException('Correo electronico o contraseña invalidos'));
  });
});