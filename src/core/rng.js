// core/rng.js — bộ ngẫu nhiên GIEO HẠT (seeded PRNG). Nền tảng cho chế độ thi đấu:
// cùng một "seed" → cùng chuỗi ngẫu nhiên → cùng bố trí vật cản/quái (màn chơi công bằng).
//
// Dùng mulberry32: nhỏ, nhanh, chất lượng đủ tốt cho game. KHÔNG dùng cho mật mã.
// Ngữ nghĩa range(a,b) khớp hàm rnd(a,b) của game (a + x*(b-a)) để sau này thay thế được.

// Sinh hàm trả số thực [0,1) từ một hạt 32-bit.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Băm chuỗi (vd mã đua "KV7Q") thành hạt 32-bit (FNV-1a). Cùng chuỗi → cùng hạt.
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const toSeed = (s) => (typeof s === 'string' ? hashSeed(s) : s >>> 0);

// Tạo một bộ RNG có thể gieo lại. seed là số hoặc chuỗi.
export function makeRng(seed) {
  let next = mulberry32(toSeed(seed));
  return {
    next: () => next(), // [0,1)
    range: (a, b) => a + next() * (b - a), // như rnd(a,b): [a,b)
    int: (a, b) => a + Math.floor(next() * (b - a + 1)), // số nguyên [a,b]
    pick: (arr) => arr[Math.floor(next() * arr.length)], // chọn 1 phần tử
    reseed(s) {
      next = mulberry32(toSeed(s));
    },
  };
}
