import { Test, TestingModule } from '@nestjs/testing';

import { PasswordEncoder } from '../../../src/domain/auth/password-encoder';

describe('PasswordEncoder', () => {
  let passwordEncoder: PasswordEncoder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordEncoder],
    }).compile();

    passwordEncoder = module.get<PasswordEncoder>(PasswordEncoder);
  });

  describe('hashPassword', () => {
    it('평문 비밀번호를 해시로 변환해야 한다', async () => {
      // Given
      const plainPassword = 'testPassword123!';

      // When
      const hashedPassword = await passwordEncoder.hashPassword(plainPassword);

      // Then
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt 해시 형식
    });
  });

  describe('comparePassword', () => {
    it('올바른 비밀번호를 입력하면 true를 반환해야 한다', async () => {
      // Given
      const plainPassword = 'testPassword123!';
      const hashedPassword = await passwordEncoder.hashPassword(plainPassword);

      // When
      const result = await passwordEncoder.comparePassword(plainPassword, hashedPassword);

      // Then
      expect(result).toBe(true);
    });

    it('잘못된 비밀번호를 입력하면 false를 반환해야 한다', async () => {
      // Given
      const plainPassword = 'testPassword123!';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await passwordEncoder.hashPassword(plainPassword);

      // When
      const result = await passwordEncoder.comparePassword(wrongPassword, hashedPassword);

      // Then
      expect(result).toBe(false);
    });
  });
});
