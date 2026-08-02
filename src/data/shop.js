// data/shop.js — CỬA HÀNG. Dữ liệu thuần: thêm/sửa món ở đây, không đụng vào mã.
//
// Nguyên tắc đặt giá: một ván chơi tử tế kiếm được cỡ 80–150 xu (25 qua mê cung + 5/sao
// + 10/câu đúng + xu nhặt). Món rẻ nhất mua được sau ~1 ván, món đắt nhất sau ~4–5 ván.
// Đắt hơn nữa thì bé nản; rẻ hơn nữa thì mua hết trong một buổi, mất chỗ tiêu xu.
//
// KHÔNG có món nào làm game dễ đến mức mất ý nghĩa: vũ khí chỉ giảm số nhát chém, đèn chỉ
// mở rộng tầm nhìn — không món nào bỏ qua được câu hỏi. Kiến thức không mua bằng xu được.

export const CUA_HANG = [
  {
    id: 'kiem1',
    ten: '🗡️ Kiếm gỗ',
    gia: 60,
    mo: 'Hạ quái bằng 1 nhát thay vì 2',
    hieu: { satThuong: 2 },
  },
  {
    id: 'kiem2',
    ten: '⚔️ Kiếm sắt',
    gia: 160,
    mo: 'Sát thương 3 — hạ cả quái khoẻ',
    hieu: { satThuong: 3 },
  },
  {
    id: 'giap1',
    ten: '🛡️ Áo giáp',
    gia: 120,
    mo: 'Thêm 2 tim',
    hieu: { themTim: 2 },
  },
  {
    id: 'giay1',
    ten: '👟 Giày nhanh',
    gia: 100,
    mo: 'Đi nhanh hơn 25%',
    hieu: { tocDo: 1.25 },
  },
  {
    id: 'den1',
    ten: '🔦 Đèn pin',
    gia: 90,
    mo: 'Nhìn xa thêm 2 ô',
    hieu: { themNhin: 2 },
  },
];

// Gộp hiệu lực của các món ĐÃ MUA thành một bộ chỉ số. Món cùng loại lấy giá trị TỐT NHẤT
// chứ không cộng dồn — mua kiếm sắt rồi thì kiếm gỗ thành thừa, không nhân đôi sát thương.
export function chiSo(daMua = []) {
  const co = new Set(daMua);
  let satThuong = 1,
    themTim = 0,
    tocDo = 1,
    themNhin = 0;
  for (const m of CUA_HANG) {
    if (!co.has(m.id)) continue;
    const h = m.hieu;
    if (h.satThuong) satThuong = Math.max(satThuong, h.satThuong);
    if (h.themTim) themTim += h.themTim;
    if (h.tocDo) tocDo = Math.max(tocDo, h.tocDo);
    if (h.themNhin) themNhin += h.themNhin;
  }
  return { satThuong, themTim, tocDo, themNhin };
}
