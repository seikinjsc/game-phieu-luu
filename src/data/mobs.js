// data/mobs.js — bảng thuộc tính quái (MOB). DỮ LIỆU THUẦN, không đổi số nào.
//
// Mỗi mục:
//   w,h   kích thước hộp va chạm
//   hp    máu (đè đầu 1 lần trừ 1; vũ khí trừ theo dmg)
//   spd   tốc độ di chuyển của quái (px/s)
//   sc    điểm khi hạ
//   co    xu rơi ra khi hạ
//   fly   1 = quái bay (không đè đầu được, phải dùng vũ khí)
//   amp   biên độ dao động lên xuống của quái bay (px)
export const MOB = {
  slime: { w: 42, h: 34, hp: 1, spd: 40, sc: 15, co: 5 },
  spider: { w: 46, h: 30, hp: 1, spd: 120, sc: 20, co: 7 },
  bat: { w: 46, h: 34, hp: 1, fly: 1, spd: 36, amp: 36, sc: 22, co: 8 },
  ghost: { w: 44, h: 46, hp: 2, fly: 1, spd: 74, amp: 64, sc: 34, co: 12 },
  jelly: { w: 46, h: 54, hp: 1, fly: 1, spd: 18, amp: 66, sc: 20, co: 7 },
  crab: { w: 50, h: 34, hp: 1, spd: 70, sc: 22, co: 8 },
  puffer: { w: 54, h: 50, hp: 2, fly: 1, spd: 52, amp: 26, sc: 30, co: 11 },
  eel: { w: 74, h: 28, hp: 2, fly: 1, spd: 118, amp: 96, sc: 38, co: 14 },
  shark: { w: 126, h: 54, hp: 3, fly: 1, spd: 150, amp: 34, sc: 60, co: 22 },
  drone: { w: 46, h: 38, hp: 1, fly: 1, spd: 44, amp: 40, sc: 24, co: 9 },
  alien: { w: 44, h: 40, hp: 1, spd: 74, sc: 26, co: 10 },
  orb: { w: 42, h: 42, hp: 2, fly: 1, spd: 96, amp: 86, sc: 40, co: 15 },
  bot: { w: 56, h: 56, hp: 2, fly: 1, spd: 64, amp: 30, sc: 46, co: 18 },
  guard: { w: 76, h: 74, hp: 3, fly: 1, spd: 78, amp: 44, sc: 70, co: 26 },
  octo: { w: 56, h: 50, hp: 2, fly: 1, spd: 40, amp: 52, sc: 44, co: 17 },
  penguin: { w: 44, h: 46, hp: 1, spd: 96, sc: 26, co: 10 },
  owl: { w: 56, h: 44, hp: 1, fly: 1, spd: 70, amp: 70, sc: 32, co: 12 },
  wolf: { w: 78, h: 46, hp: 2, spd: 150, sc: 48, co: 19 },
  sprite: { w: 44, h: 48, hp: 2, fly: 1, spd: 64, amp: 76, sc: 42, co: 17 },
  yeti: { w: 82, h: 88, hp: 3, spd: 56, sc: 80, co: 30 },
  roach: { w: 48, h: 26, hp: 1, spd: 130, sc: 24, co: 10 },
  mosq: { w: 44, h: 34, hp: 1, fly: 1, spd: 110, amp: 60, sc: 30, co: 12 },
  leech: { w: 52, h: 40, hp: 2, fly: 1, spd: 46, amp: 44, sc: 38, co: 15 },
  spiderS: { w: 52, h: 46, hp: 2, fly: 1, spd: 30, amp: 0, sc: 44, co: 18 },
  frog: { w: 60, h: 48, hp: 2, spd: 60, sc: 50, co: 20 },
  snail: { w: 64, h: 52, hp: 3, spd: 38, sc: 66, co: 26 },
  parrot: { w: 52, h: 40, hp: 1, fly: 1, spd: 80, amp: 56, sc: 34, co: 14 },
  batX: { w: 50, h: 38, hp: 1, fly: 1, spd: 120, amp: 88, sc: 38, co: 15 },
  boar: { w: 86, h: 52, hp: 2, spd: 120, sc: 56, co: 22 },
  snakeV: { w: 44, h: 58, hp: 2, fly: 1, spd: 20, amp: 0, sc: 50, co: 20 },
  mantis: { w: 72, h: 64, hp: 2, spd: 86, sc: 64, co: 25 },
  spiderJ: { w: 78, h: 62, hp: 3, fly: 1, spd: 52, amp: 40, sc: 86, co: 34 },
};
