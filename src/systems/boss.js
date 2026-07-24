// systems/boss.js — máy trạng thái giai đoạn trùm. Tách từ legacy.
//
// LỖI LỊCH SỬ #3 & #4 (CLAUDE.md):
//   #3 Ngưỡng giai đoạn phải theo TỈ LỆ máu (>66% / 33–66% / <33%), KHÔNG dùng số
//      tuyệt đối (trùm 42 máu từng kẹt ở giai đoạn 1 suốt trận).
//   #4 Giai đoạn CHỈ TĂNG, không lùi — trùm hồi máu không được nhảy về giai đoạn dễ.
// Cả hai gói gọn trong bossPhase() dưới đây. Đừng đổi.

// Máu cơ sở từng trùm (trước khi nhân hệ số độ khó). dragon = mặc định (BOSSHP=12).
export const BOSS_MAXHP = { dragon: 12, kraken: 22, robot: 26, titan: 32, rat: 38, monkey: 42 };

// Máu trùm thực tế = cơ sở × hệ số độ khó (DIFF[diff].boss), làm tròn.
export function bossHp(kind, diffBoss = 1) {
  return Math.round((BOSS_MAXHP[kind] ?? BOSS_MAXHP.dragon) * diffBoss);
}

// Giai đoạn hiện tại theo tỉ lệ máu, chỉ tăng không lùi.
export function bossPhase(hp, max, prevPh = 1) {
  const fr = hp / max;
  return Math.max(prevPh || 1, fr > 0.66 ? 1 : fr > 0.33 ? 2 : 3);
}
