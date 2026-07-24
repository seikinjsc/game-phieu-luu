import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Kiểm tra khung dự án dựng đúng — thay bằng test game thật ở các giai đoạn sau.
describe('khung dự án', () => {
  it('package.json có đủ script bắt buộc', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
    for (const s of ['dev', 'build', 'preview', 'test', 'lint']) {
      expect(pkg.scripts[s], `thiếu script "${s}"`).toBeTruthy();
    }
  });
});
