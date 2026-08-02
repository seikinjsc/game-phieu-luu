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
// Trục độ khó MÊ CUNG — tách rời khỏi trục kiến thức (xem ME-CUNG-DESIGN.md §3).
// Một người lớn chọn "Dễ" và một bé 6 tuổi chọn "Dễ" cần hai thứ khác hẳn nhau:
// người lớn muốn mê cung nhẹ nhàng, bé cần câu hỏi lớp 1. Nên hai trục không dùng chung bảng.
//   size   số ô lưới mỗi chiều (luôn lẻ)
//   gates  số cửa khoá
//   sight  bán kính nhìn thấy, tính theo ô (99 = thấy toàn bản đồ)
//   speed  tốc độ đi, ô/giây
//   time   giới hạn thời gian, giây (0 = không giới hạn)
//   compass la bàn chỉ cửa gần nhất: 'luon' | 'bam' | 'khong'
//   quai   số quái tuần tra · tocQuai tốc độ quái (ô/giây) · tim  số tim khởi đầu
// (Bản thiết kế §3 ghi mức Dễ 0 quái. Đã nâng lên 1 con đi chậm: 0 con thì bé chơi mức Dễ
//  không bao giờ biết trong game có quái, mất hẳn một nửa cách chơi.)
export const MAZE_DIFF = [
  {
    n: '🧸 Dễ',
    size: 15,
    gates: 3,
    sight: 99,
    speed: 3.6,
    time: 0,
    compass: 'luon',
    quai: 1,
    tocQuai: 1.7,
    tim: 5,
  },
  {
    n: '⚔️ Vừa',
    size: 21,
    gates: 5,
    sight: 7,
    speed: 4.2,
    time: 300,
    compass: 'bam',
    quai: 3,
    tocQuai: 2.3,
    tim: 4,
  },
  {
    n: '💀 Khó',
    size: 31,
    gates: 7,
    sight: 4,
    speed: 4.8,
    time: 420,
    compass: 'khong',
    quai: 5,
    tocQuai: 2.9,
    tim: 3,
  },
];

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
