module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testMatch: ['**/*.spec.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@haru-control/types$': '<rootDir>/libs/types/src/index.ts',
    '^@haru-control/ui$': '<rootDir>/libs/ui/src/index.ts',
    '^@haru-control/utils$': '<rootDir>/libs/utils/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.base.json',
      },
    ],
  },
};
