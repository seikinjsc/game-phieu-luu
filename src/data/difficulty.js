// data/difficulty.js — 3 mức độ khó. DỮ LIỆU THUẦN, không đổi giá trị nào.
//
// Mỗi mức là hệ số nhân/điều chỉnh áp lên gameplay:
//   n     tên hiển thị (có emoji)
//   sp    ×tốc độ cuộn thế giới        (Bé chậm 0.88, Người lớn nhanh 1.20)
//   gap   ×khoảng cách giữa vật cản    (Bé thưa 1.18, Người lớn dày 0.84)
//   mhp   +máu quái từ chương 2 trở đi (Người lớn +1)
//   mob   ×nhịp sinh quái — SỐ CÀNG NHỎ QUÁI CÀNG DÀY (Bé 1.3 thưa, Người lớn 0.66 dày)
//   pu    ×độ hiếm bảo bối/vật phẩm    (Bé dễ 0.85, Người lớn hiếm 1.35)
//   boss  ×máu trùm                    (Bé 0.8, Người lớn 1.4)
//   hrt   +tim khởi đầu                (Bé +2, Người lớn −1)
//   shot  ×nhịp bắn của trùm           (Bé chậm 0.75, Người lớn nhanh 1.45)
export const DIFF = [
  { n: '🧸 Bé', sp: 0.88, gap: 1.18, mhp: 0, mob: 1.3, pu: 0.85, boss: 0.8, hrt: 2, shot: 0.75 },
  { n: '⚔️ Thường', sp: 1, gap: 1, mhp: 0, mob: 1, pu: 1, boss: 1, hrt: 0, shot: 1 },
  {
    n: '💀 Người lớn',
    sp: 1.2,
    gap: 0.84,
    mhp: 1,
    mob: 0.66,
    pu: 1.35,
    boss: 1.4,
    hrt: -1,
    shot: 1.45,
  },
];
