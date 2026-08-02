// data/rewards.js — BẢNG THƯỞNG. Dữ liệu thuần, chỉnh số ở đây, không sửa mã.
//
// Nguyên tắc đặt số (đọc trước khi chỉnh):
//   1. Trả lời ĐÚNG NGAY LẦN ĐẦU luôn đáng giá hơn hẳn mò ra sau vài lần sai. Nếu hai
//      thứ thưởng gần bằng nhau thì bé sẽ bấm bừa cho nhanh — hỏng luôn mục đích học.
//   2. Sai hết vẫn được 0, KHÔNG bị trừ. Trừ điểm làm bé sợ sai, mà sợ sai thì không dám thử.
//   3. Ô "?" thưởng đậm hơn cửa khoá vì nó KHÔNG bắt buộc — phải đủ hấp dẫn để bé chịu
//      đi vòng vào ngõ cụt lấy.

export const THUONG = {
  // Câu hỏi ở cửa khoá (bắt buộc, phải qua mới có chìa)
  cuaDungNgay: { xu: 10, diem: 100 },
  cuaDungSauSai: { xu: 4, diem: 40 }, // mò ra sau 1–2 lần sai
  cuaSaiHet: { xu: 0, diem: 0 }, // đọc lời giải rồi đi tiếp, không bị phạt điểm

  // Ô "?" thưởng (không bắt buộc, câu khó hơn một lớp)
  thuongDung: { xu: 30, diem: 300 },
  thuongSai: { xu: 0, diem: 0 },

  nhatXu: { xu: 5, diem: 20 }, // xu rơi ở ngõ cụt
  quaMeCung: { xu: 25, diem: 250 }, // thưởng cơ bản khi ra khỏi mê cung
  moiSao: { xu: 5, diem: 100 }, // mỗi cửa trả lời đúng ngay lần đầu
  moiGiayConLai: { xu: 0, diem: 2 }, // về đích sớm được thưởng theo giây còn dư
};

// Phạt khi trả lời sai: CỘNG THÊM GIÂY vào đồng hồ, không trừ máu, không chặn đường.
export const PHAT_GIAY_SAI = 15;

// Số ô "?" thưởng theo mức khó (0 Dễ · 1 Vừa · 2 Khó).
export const SO_O_THUONG = [2, 3, 4];
