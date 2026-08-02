import { describe, it, expect } from 'vitest';
import { makeProgress, KHOA } from '../src/systems/progress.js';
import { THUONG, SO_O_THUONG, PHAT_GIAY_SAI } from '../src/data/rewards.js';

// Kho lưu giả — tiêm vào thay localStorage để test chạy được ở node.
const khoGia = (banDau = null) => {
  const d = banDau ? { [KHOA]: banDau } : {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => (d[k] = String(v)), d };
};

describe('systems/progress: ví xu và điểm', () => {
  it('bắt đầu từ 0 khi chưa có gì lưu', () => {
    const v = makeProgress(khoGia());
    expect(v.xu).toBe(0);
    expect(v.diem).toBe(0);
    expect(v.daMua).toEqual([]);
  });

  it('cộng thưởng và ghi xuống kho', () => {
    const kho = khoGia();
    const v = makeProgress(kho);
    v.cong({ xu: 10, diem: 100 });
    v.cong({ xu: 5, diem: 50 });
    expect(v.xu).toBe(15);
    expect(v.diem).toBe(150);
    expect(makeProgress(kho).xu).toBe(15); // nạp lại từ kho vẫn còn
  });

  // Luật §2 bảng thưởng: không bao giờ TRỪ điểm của bé. Sợ sai thì không dám thử.
  it('số âm bị bỏ qua, không bao giờ trừ ví', () => {
    const v = makeProgress(khoGia());
    v.cong({ xu: 20, diem: 200 });
    v.cong({ xu: -50, diem: -500 });
    expect(v.xu).toBe(20);
    expect(v.diem).toBe(200);
  });

  it('giữ kỷ lục điểm cao nhất', () => {
    const v = makeProgress(khoGia());
    v.cong({ diem: 300 });
    expect(v.caoNhat).toBe(300);
    v.cong({ diem: 120 });
    expect(v.diem).toBe(420);
    expect(v.caoNhat).toBe(420);
  });

  it('tiêu xu: không đủ thì từ chối, ví KHÔNG BAO GIỜ âm', () => {
    const v = makeProgress(khoGia());
    v.cong({ xu: 30 });
    expect(v.tieu(50)).toBe(false);
    expect(v.xu).toBe(30);
    expect(v.tieu(30)).toBe(true);
    expect(v.xu).toBe(0);
    expect(v.tieu(1)).toBe(false);
    expect(v.tieu(0)).toBe(false);
    expect(v.tieu(-5)).toBe(false);
    expect(v.xu).toBe(0);
  });

  it('mua món: trừ xu một lần, mua lại không trừ oan', () => {
    const v = makeProgress(khoGia());
    v.cong({ xu: 100 });
    expect(v.mua('kiem1', 60)).toBe(true);
    expect(v.xu).toBe(40);
    expect(v.coMon('kiem1')).toBe(true);
    expect(v.mua('kiem1', 60)).toBe(false); // đã có rồi
    expect(v.xu).toBe(40); // và KHÔNG bị trừ thêm
    expect(v.mua('kiem2', 99)).toBe(false); // không đủ xu
    expect(v.xu).toBe(40);
  });

  it('dữ liệu lưu bị hỏng thì bắt đầu lại từ 0, không ném lỗi', () => {
    expect(() => makeProgress(khoGia('{{{ rác'))).not.toThrow();
    expect(makeProgress(khoGia('{{{ rác')).xu).toBe(0);
    expect(makeProgress(khoGia('{"xu":-9,"daMua":"sai kiểu"}')).xu).toBe(0);
    expect(makeProgress(khoGia('{"xu":-9,"daMua":"sai kiểu"}')).daMua).toEqual([]);
  });

  it('kho ném lỗi khi ghi thì vẫn chơi được, chỉ mất phần lưu', () => {
    const khoHong = {
      getItem: () => null,
      setItem: () => {
        throw new Error('hết dung lượng');
      },
    };
    const v = makeProgress(khoHong);
    expect(() => v.cong({ xu: 10 })).not.toThrow();
    expect(v.xu).toBe(10);
  });
});

describe('data/rewards: bảng thưởng hợp lý', () => {
  // Nếu mò ra sau vài lần sai mà thưởng gần bằng đúng ngay, bé sẽ bấm bừa cho nhanh.
  it('ĐÚNG NGAY LẦN ĐẦU phải đáng giá hơn hẳn mò ra sau khi sai', () => {
    expect(THUONG.cuaDungNgay.xu).toBeGreaterThan(THUONG.cuaDungSauSai.xu * 2);
    expect(THUONG.cuaDungNgay.diem).toBeGreaterThan(THUONG.cuaDungSauSai.diem * 2);
  });

  it('ô "?" thưởng đậm hơn cửa khoá — vì nó không bắt buộc, phải đi vòng mới lấy được', () => {
    expect(THUONG.thuongDung.xu).toBeGreaterThan(THUONG.cuaDungNgay.xu);
    expect(THUONG.thuongDung.diem).toBeGreaterThan(THUONG.cuaDungNgay.diem);
  });

  it('sai không bao giờ bị trừ — mọi phần thưởng đều ≥ 0', () => {
    for (const [k, t] of Object.entries(THUONG)) {
      expect(t.xu ?? 0, k).toBeGreaterThanOrEqual(0);
      expect(t.diem ?? 0, k).toBeGreaterThanOrEqual(0);
    }
  });

  it('phạt sai là CỘNG GIÂY, không phải trừ điểm', () => {
    expect(PHAT_GIAY_SAI).toBeGreaterThan(0);
    expect(SO_O_THUONG).toHaveLength(3);
    for (const n of SO_O_THUONG) expect(n).toBeGreaterThan(0);
  });
});
