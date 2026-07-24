# Nhật ký thay đổi

Mọi thay đổi đáng kể của dự án được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
dự án tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

## [Chưa phát hành]

### Changed

- **`npm run build` đóng gói bản CHƠI ĐƯỢC** (`legacy/`) thành `dist/game.html` (nhúng
  phiên bản vào tiêu đề) để deploy lên GitHub Pages ngay. Build Vite của bản module dời
  sang `npm run build:app` (dùng khi hoàn tất tích hợp `src/`).

### Added

- **Lưu tiến trình tiện hơn** (trong `legacy/`): thêm **ô lưu đặt tên** trong máy
  (localStorage — nạp/xoá không cần mã) và **xuất/nhập bằng TỆP** (tải tệp `.txt` về máy /
  chọn tệp để nhập). Vẫn giữ ô dán mã `BPL1` cũ để tương thích ngược. Định dạng mã không đổi.
  Kiểm chứng bằng `tests/save-ux.test.js`.

## [0.1.0] — 2026-07-24

Dựng lại dự án từ bản HTML một-tệp (`legacy/`) thành kiến trúc module hoá,
có kiểm thử tự động không cần trình duyệt.

### Added

- **Khung dự án** (GĐ1): Vite + `vite-plugin-singlefile` → `npm run build` gộp thành một
  `dist/game.html`; Vitest; ESLint + Prettier; cấu trúc `src/{core,data,systems,render,ui}`.
- **Dữ liệu thuần** (GĐ2): tách `src/data/` — `stages` (60 cửa), `obstacles`, `mobs`,
  `gear` (6 bộ theo thế giới), `palettes` (10 bảng màu), `difficulty`. Kiểm chứng khớp
  100% bản gốc bằng `tools/verify-extract.mjs`.
- **Harness headless** (GĐ3): `tools/harness.mjs` giả lập DOM/Canvas/Web Audio; smoke test
  chạy 60 cửa × 3 bộ đồ hoạ, khẳng định không lỗi âm thanh.
- **Lõi engine** (GĐ4): `src/core/` — `audio` (kẹp tham số `tone()`), `save` (mã BPL1
  tương thích byte với bản cũ), `loop`, `input`, `state`.
- **Hệ thống chơi** (GĐ5): `src/systems/` — `physics` (bảng dispatch 6 thế giới,
  engine cuộn khớp bit với legacy), `boss` (giai đoạn theo tỉ lệ máu, chỉ tăng),
  `combat`, `spawner`.
- **Đồ hoạ** (GĐ6): `src/render/` — `registry` (bảng đăng ký GFX + kiểm đủ cột),
  `layers` (haze/pop/bóng đổ), `hud` (`layoutHUD`); `tools/hud-check.mjs` dò chồng ô HUD.
- **Cân bằng tự động** (GĐ7): `tools/balance.mjs` — tầm nhảy vs khoảng cách vật cản,
  thời gian hạ trùm (3 khó × 3 vũ khí), tương phản màu WCAG.
- **Tự động hoá** (GĐ8): CI (`ci.yml`: lint + test + cân bằng + build), deploy GitHub Pages
  (`deploy.yml`), số phiên bản từ `package.json` hiện ở tiêu đề game.

### Notes

- Mã lưu tiến trình giữ định dạng `BPL1-…` — hợp đồng công khai, không đổi.
- Các hằng số cân bằng (`GY`, `KX`, kích thước canvas, vật lý nhảy) giữ nguyên từ bản gốc.
