import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';

describe('RegisterDto', () => {
  it('accepts a valid registration', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'Test User',
      email: 'test@eventure.app',
      password: 'a-real-password',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a password under 8 characters', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'Test User',
      email: 'test@eventure.app',
      password: 'short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('rejects a malformed email', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'Test User',
      email: 'not-an-email',
      password: 'a-real-password',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects a name that is too short', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'A',
      email: 'test@eventure.app',
      password: 'a-real-password',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});

describe('LoginDto', () => {
  it('accepts a valid login', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'test@eventure.app',
      password: 'anything',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing email', async () => {
    const dto = plainToInstance(LoginDto, { password: 'anything' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});
