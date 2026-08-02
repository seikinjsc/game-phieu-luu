import { describe, it, expect } from 'vitest';
import {
  hangNut,
  batNut,
  nutManChon,
  nutCauHoi,
  nutManThang,
  nutTrongMeCung,
  nutCuaHang,
  toaDoChuot,
  MAU,
  W,
  H,
  MENU_Y,
} from '../src/ui/mecung-ui.js';
import { MAZE_DIFF } from '../src/data/difficulty.js';
import { CUA_HANG } from '../src/data/shop.js';
import { BO_DE, timBoDe } from '../src/data/banks.js';

const monGia = CUA_HANG.map((m) => ({ ...m, daCo: false }));

const stMenu = (o = {}) => ({
  muc: 1,
  boDe: 'toan',
  boDeList: BO_DE,
  capList: timBoDe('toan').capDo,
  cap: '1',
  moBoDe: timBoDe('toan').mo,
  mucList: MAZE_DIFF,
  tenSkin: '🟫 Xứ Khối Vuông',
  ...o,
});
const moiNut = (st) => [
  ...nutManChon(stMenu(st)),
  ...nutCauHoi({ dapAn: ['a', 'b', 'c', 'd'], k: 0, sai: [1], loiGiai: true }),
  ...nutManThang(),
  ...nutTrongMeCung(),
];

describe('ui/mecung-ui: bố cục nút', () => {
  it(`mọi nút nằm gọn trong canvas ${W}×${H}`, () => {
    for (const b of [...moiNut(), ...nutCuaHang(monGia, 999)]) {
      expect(b.x, b.id).toBeGreaterThanOrEqual(0);
      expect(b.y, b.id).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w, b.id).toBeLessThanOrEqual(W);
      expect(b.y + b.h + 4, b.id).toBeLessThanOrEqual(H); // +4 cho bóng đổ dưới đáy nút
    }
  });

  // Đây là lỗi thật người dùng gặp: nhãn mục và ghi chú đè lên nút. Test cũ chỉ canh
  // nút-với-nút nên không bắt được. Nay canh cả CHỮ với NÚT.
  it('CHỮ trên màn chọn không đè lên nút nào', () => {
    const nut = nutManChon(stMenu());
    // baseline của từng dòng chữ + chiều cao chữ ước lượng
    const chu = [
      [MENU_Y.tieuDe, 38],
      [MENU_Y.nhan1, 17],
      [MENU_Y.nhan2, 17],
      [MENU_Y.nhan3, 17],
      [MENU_Y.ghiChu, 14],
      [MENU_Y.nhacPhim, 14],
    ];
    for (const [baseline, cao] of chu) {
      const tren = baseline - cao,
        duoi = baseline + 4;
      for (const b of nut) {
        // Bỏ qua hai nút ◀ ▶: số lớp CỐ Ý nằm giữa chúng, không phải lỗi.
        if (b.id === 'capLui' || b.id === 'capTien') continue;
        const de = duoi <= b.y || tren >= b.y + b.h;
        expect(de, `chữ ở y=${baseline} đè lên nút ${b.id} (${b.y}..${b.y + b.h})`).toBe(true);
      }
    }
  });

  it('mỗi nhãn mục nằm NGAY TRÊN hàng nút của nó, không trôi đi đâu', () => {
    const cap = [
      [MENU_Y.nhan1, MENU_Y.hangMuc],
      [MENU_Y.nhan2, MENU_Y.hangBoDe],
      [MENU_Y.nhan3, MENU_Y.hangPhu],
    ];
    for (const [nhan, hang] of cap) {
      expect(nhan).toBeLessThan(hang); // nhãn ở trên
      expect(hang - nhan).toBeLessThan(40); // và sát ngay đó, không cách cả màn hình
    }
  });

  it('số lớp nằm ĐÚNG GIỮA hai nút ◀ ▶', () => {
    const nut = nutManChon(stMenu());
    const lui = nut.find((b) => b.id === 'capLui');
    const tien = nut.find((b) => b.id === 'capTien');
    expect((lui.x + lui.w + tien.x) / 2).toBeCloseTo(W / 2, 0);
    expect(lui.y).toBe(tien.y);
  });

  it('nút đủ TO để bé bấm — cạnh ngắn nhất ≥ 44 điểm ảnh', () => {
    for (const b of moiNut()) {
      expect(b.w, b.id).toBeGreaterThanOrEqual(44);
      expect(b.h, b.id).toBeGreaterThanOrEqual(44);
    }
  });

  it('nút trong cùng một màn KHÔNG chồng lên nhau', () => {
    const kiem = (nut) => {
      for (let i = 0; i < nut.length; i++)
        for (let j = i + 1; j < nut.length; j++) {
          const a = nut[i],
            b = nut[j];
          const de = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
          expect(de, `${a.id} đè lên ${b.id}`).toBe(true);
        }
    };
    kiem(nutManChon(stMenu()));
    kiem(nutCauHoi({ dapAn: ['a', 'b', 'c', 'd'], k: 0, sai: [], loiGiai: true }));
    kiem(nutManThang());
    kiem(nutCuaHang(monGia, 999)); // cửa hàng 5 món cũng không được chồng nhau
    kiem(nutTrongMeCung({ nhac: 1, tieng: 1 }));
  });

  // Vừa qua cửa là lúc bé có nhiều xu nhất và muốn tiêu nhất. Bắt quay về màn chọn mới
  // mua được là chặn đúng lúc người ta muốn mua.
  it('MÀN THẮNG có lối vào cửa hàng ngay tại chỗ', () => {
    const nut = nutManThang();
    expect(nut.map((b) => b.id)).toContain('moShop');
    expect(nut.map((b) => b.id).sort()).toEqual(['lai', 'moShop', 'tiep', 've'].sort());
  });

  it('màn thắng: "Mê cung sau" là nút chính, to hơn ba nút phụ', () => {
    const nut = nutManThang();
    const tiep = nut.find((b) => b.id === 'tiep');
    for (const b of nut.filter((x) => x.id !== 'tiep')) {
      expect(tiep.w, `${b.id}`).toBeGreaterThan(b.w);
      expect(tiep.y, `${b.id}`).toBeLessThan(b.y); // và nằm trên
    }
    expect(tiep.mau).toBe('hong');
  });

  it('nút trong mê cung nằm gọn trên thanh đỉnh, không che mê cung', () => {
    for (const b of nutTrongMeCung({ nhac: 1, tieng: 1 }))
      expect(b.y + b.h, b.id).toBeLessThanOrEqual(52);
  });

  it('mọi nút đều khai báo màu có thật trong bảng', () => {
    for (const b of moiNut()) if (b.mau) expect(Object.keys(MAU)).toContain(b.mau);
  });

  it('hangNut chia đều bề ngang, không tràn', () => {
    const n = hangNut([{ id: 'a' }, { id: 'b' }, { id: 'c' }], { x: 100, y: 50, w: 600, h: 50 });
    expect(n).toHaveLength(3);
    expect(n[0].x).toBe(100);
    expect(n[2].x + n[2].w).toBeCloseTo(700);
    for (const b of n) expect(b.w).toBeCloseTo(n[0].w);
  });
});

describe('ui/mecung-ui: bắt chuột', () => {
  it('bấm đúng giữa nút thì trúng nút đó', () => {
    const nut = nutManChon(stMenu());
    for (const b of nut) {
      if (b.tat) continue;
      expect(batNut(nut, b.x + b.w / 2, b.y + b.h / 2)).toBe(b.id);
    }
  });

  it('bấm ra ngoài mọi nút thì trả null', () => {
    const nut = nutManChon(stMenu());
    expect(batNut(nut, 5, 5)).toBe(null);
    expect(batNut(nut, 895, 495)).toBe(null);
  });

  it('nút bị TẮT thì không bấm được', () => {
    // lớp 1 → nút lùi bị tắt; lớp 5 → nút tiến bị tắt
    const n1 = nutManChon(stMenu({ cap: '1' }));
    const lui = n1.find((b) => b.id === 'capLui');
    expect(lui.tat).toBe(true);
    expect(batNut(n1, lui.x + lui.w / 2, lui.y + lui.h / 2)).toBe(null);

    const n5 = nutManChon(stMenu({ cap: '5' }));
    const tien = n5.find((b) => b.id === 'capTien');
    expect(tien.tat).toBe(true);
    expect(batNut(n5, tien.x + tien.w / 2, tien.y + tien.h / 2)).toBe(null);
    // ở lớp giữa thì cả hai đều bấm được
    const n3 = nutManChon(stMenu({ cap: '3' }));
    expect(n3.find((b) => b.id === 'capLui').tat).toBe(false);
    expect(n3.find((b) => b.id === 'capTien').tat).toBe(false);
  });

  it('mức đang chọn được đánh dấu, và chỉ đúng một mức', () => {
    for (let m = 0; m < 3; m++) {
      const nut = nutManChon(stMenu({ muc: m }));
      const chon = nut.filter((b) => b.chon && b.id.startsWith('muc'));
      expect(chon).toHaveLength(1);
      expect(chon[0].id).toBe('muc' + m);
    }
  });

  it('màn câu hỏi: chỉ hiện nút "Đi tiếp" SAU KHI đã có lời giải', () => {
    const chua = nutCauHoi({ dapAn: ['a', 'b', 'c', 'd'], k: 0, sai: [1], loiGiai: false });
    expect(chua.some((b) => b.id === 'tiepTuc')).toBe(false);
    const roi = nutCauHoi({ dapAn: ['a', 'b', 'c', 'd'], k: 0, sai: [1, 2, 3], loiGiai: true });
    expect(roi.some((b) => b.id === 'tiepTuc')).toBe(true);
    expect(roi.find((b) => b.id === 'dapAn0').dung).toBe(true); // đáp án đúng được tô xanh
    expect(roi.find((b) => b.id === 'dapAn2').sai).toBe(true);
  });
});

describe('ui/mecung-ui: đổi toạ độ chuột', () => {
  it('canvas bị CSS co giãn vẫn ra đúng toạ độ logic', () => {
    // canvas hiện với bề ngang 450 (một nửa) → bấm ở 225 phải ra 450 trong hệ logic
    const rect = { left: 0, top: 0, width: 450, height: 320 }; // canvas thu nửa
    expect(toaDoChuot(rect, 225, 160)).toEqual({ x: W / 2, y: H / 2 });
  });

  it('trừ đúng lề trái/trên của canvas trong trang', () => {
    const rect = { left: 100, top: 40, width: W, height: H };
    expect(toaDoChuot(rect, 100, 40)).toEqual({ x: 0, y: 0 });
    expect(toaDoChuot(rect, 100 + W / 2, 40 + H / 2)).toEqual({ x: W / 2, y: H / 2 });
  });

  it('khung 0 (canvas chưa gắn vào trang) trả null thay vì chia cho 0', () => {
    expect(toaDoChuot({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toBe(null);
    expect(toaDoChuot(null, 10, 10)).toBe(null);
  });
});
