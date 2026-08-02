import { describe, it, expect } from 'vitest';
import { makeMaze, bfs, solve, WALL, FLOOR, MAZE_SIZE, MAZE_GATES } from '../src/systems/maze.js';

const floors = (m) => {
  const out = [];
  for (let i = 0; i < m.grid.length; i++) if (m.grid[i] === FLOOR) out.push(i);
  return out;
};

describe('systems/maze: sinh mê cung', () => {
  it('cùng hạt → mê cung y hệt; hạt khác → khác', () => {
    const a = makeMaze(2026, { size: 21 });
    const b = makeMaze(2026, { size: 21 });
    expect(Array.from(a.grid)).toEqual(Array.from(b.grid));
    expect(a.exit).toEqual(b.exit);
    expect(a.gates).toEqual(b.gates);
    expect(Array.from(makeMaze(2027, { size: 21 }).grid)).not.toEqual(Array.from(a.grid));
  });

  it('kích thước luôn LẺ, kể cả khi truyền số chẵn', () => {
    expect(makeMaze(1, { size: 20 }).size).toBe(21);
    expect(makeMaze(1, { size: 21 }).size).toBe(21);
  });

  it('viền ngoài luôn kín — không đi lọt ra khỏi mê cung', () => {
    for (const size of MAZE_SIZE) {
      const m = makeMaze(7, { size });
      for (let i = 0; i < size; i++) {
        expect(m.grid[i]).toBe(WALL); // hàng trên
        expect(m.grid[(size - 1) * size + i]).toBe(WALL); // hàng dưới
        expect(m.grid[i * size]).toBe(WALL); // cột trái
        expect(m.grid[i * size + size - 1]).toBe(WALL); // cột phải
      }
    }
  });

  // LUẬT QUAN TRỌNG NHẤT: không được có vùng chết. Một ô lối đi không tới được là
  // người chơi có thể đứng nhìn cửa khoá mà không bao giờ tới nơi.
  it('mọi ô lối đi đều tới được từ điểm xuất phát', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const size of MAZE_SIZE) {
        const m = makeMaze(seed, { size });
        const d = bfs(m, m.start.x, m.start.y);
        for (const i of floors(m)) expect(d[i]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('cửa ra và MỌI cửa khoá đều tới được', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const m = makeMaze(seed, { size: 21, gates: 5 });
      const d = bfs(m, m.start.x, m.start.y);
      expect(d[m.exit.y * m.size + m.exit.x]).toBeGreaterThan(0);
      for (const g of m.gates) expect(d[g.y * m.size + g.x]).toBeGreaterThan(0);
    }
  });

  it('đục tường tạo VÒNG LẶP thật (không còn là mê cung hoàn hảo)', () => {
    // Mê cung hoàn hảo: số cạnh = số đỉnh − 1. Có vòng lặp thì cạnh nhiều hơn.
    for (let seed = 1; seed <= 20; seed++) {
      const m = makeMaze(seed, { size: 21 });
      const dinh = floors(m).length;
      let canh = 0;
      for (let y = 0; y < m.size; y++)
        for (let x = 0; x < m.size; x++) {
          if (m.grid[y * m.size + x] !== FLOOR) continue;
          if (x + 1 < m.size && m.grid[y * m.size + x + 1] === FLOOR) canh++;
          if (y + 1 < m.size && m.grid[(y + 1) * m.size + x] === FLOOR) canh++;
        }
      expect(canh).toBeGreaterThan(dinh - 1);
    }
  });

  it('không đục thủng cột góc (giữ được hình mê cung, không thành phòng trống)', () => {
    const m = makeMaze(5, { size: 21 });
    for (let y = 2; y < m.size - 1; y += 2)
      for (let x = 2; x < m.size - 1; x += 2) expect(m.grid[y * m.size + x]).toBe(WALL);
  });

  it('braid = 0 cho mê cung hoàn hảo (đối chứng cho phép đo ở trên)', () => {
    const m = makeMaze(3, { size: 21, braid: 0 });
    const dinh = floors(m).length;
    let canh = 0;
    for (let y = 0; y < m.size; y++)
      for (let x = 0; x < m.size; x++) {
        if (m.grid[y * m.size + x] !== FLOOR) continue;
        if (x + 1 < m.size && m.grid[y * m.size + x + 1] === FLOOR) canh++;
        if (y + 1 < m.size && m.grid[(y + 1) * m.size + x] === FLOOR) canh++;
      }
    expect(canh).toBe(dinh - 1);
  });
});

describe('systems/maze: đặt cửa', () => {
  it('đủ số cửa, không trùng nhau, không đè lên xuất phát hay cửa ra', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (let k = 0; k < 3; k++) {
        const m = makeMaze(seed, { size: MAZE_SIZE[k], gates: MAZE_GATES[k] });
        expect(m.gates).toHaveLength(MAZE_GATES[k]);
        const key = (p) => p.y * m.size + p.x;
        const ids = new Set(m.gates.map(key));
        expect(ids.size).toBe(m.gates.length);
        expect(ids.has(key(m.start))).toBe(false);
        expect(ids.has(key(m.exit))).toBe(false);
        for (const g of m.gates) expect(m.grid[key(g)]).toBe(FLOOR);
      }
    }
  });

  it('cửa RẢI ĐỀU — không cửa nào sát cửa khác (yêu cầu ở §2 bản thiết kế)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = makeMaze(seed, { size: 21, gates: 5 });
      for (const g of m.gates) {
        const d = bfs(m, g.x, g.y);
        for (const o of m.gates) {
          if (o === g) continue;
          expect(d[o.y * m.size + o.x]).toBeGreaterThan(3);
        }
      }
    }
  });

  it('cửa ra nằm XA điểm xuất phát, không phải ngay cạnh', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = makeMaze(seed, { size: 21 });
      const d = bfs(m, m.start.x, m.start.y);
      const ds = floors(m)
        .map((i) => d[i])
        .sort((a, b) => a - b);
      // cửa ra phải là ô xa nhất — đúng định nghĩa "đi hết mê cung mới ra được"
      expect(d[m.exit.y * m.size + m.exit.x]).toBe(ds[ds.length - 1]);
    }
  });

  it('luôn có ngõ cụt để đặt xu/tim', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = makeMaze(seed, { size: 21 });
      expect(m.deadEnds.length).toBeGreaterThan(0);
      for (const p of m.deadEnds) expect(m.grid[p.y * m.size + p.x]).toBe(FLOOR);
    }
  });

  it('mê cung tí hon không làm vỡ chương trình (xin nhiều cửa hơn chỗ trống)', () => {
    const m = makeMaze(1, { size: 5, gates: 20 });
    expect(m.gates.length).toBeLessThanOrEqual(20);
    expect(m.size).toBe(5);
  });
});

describe('systems/maze: tìm đường (dùng cho la bàn)', () => {
  it('trả đường đi liền mạch, toàn ô lối đi, đúng hai đầu', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = makeMaze(seed, { size: 21 });
      const p = solve(m, m.start.x, m.start.y, m.exit.x, m.exit.y);
      expect(p.length).toBeGreaterThan(1);
      expect(p[0]).toEqual(m.start);
      expect(p[p.length - 1]).toEqual(m.exit);
      for (const c of p) expect(m.isWall(c.x, c.y)).toBe(false);
      for (let i = 1; i < p.length; i++) {
        const d = Math.abs(p[i].x - p[i - 1].x) + Math.abs(p[i].y - p[i - 1].y);
        expect(d).toBe(1); // mỗi bước đúng 1 ô, không nhảy cóc
      }
    }
  });

  it('đường đi là NGẮN NHẤT, khớp với khoảng cách loang', () => {
    const m = makeMaze(9, { size: 21 });
    const d = bfs(m, m.start.x, m.start.y);
    for (const g of m.gates) {
      const p = solve(m, m.start.x, m.start.y, g.x, g.y);
      expect(p.length - 1).toBe(d[g.y * m.size + g.x]);
    }
  });

  it('hỏi đường tới ô tường thì trả mảng rỗng, không ném lỗi', () => {
    const m = makeMaze(1, { size: 15 });
    expect(solve(m, m.start.x, m.start.y, 0, 0)).toEqual([]);
  });

  it('isWall chặn cả toạ độ ngoài lưới', () => {
    const m = makeMaze(1, { size: 15 });
    expect(m.isWall(-1, 5)).toBe(true);
    expect(m.isWall(5, 99)).toBe(true);
    expect(m.isWall(m.start.x, m.start.y)).toBe(false);
  });
});
