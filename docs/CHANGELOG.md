# Nhật ký thay đổi

Mọi thay đổi đáng kể của dự án được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
dự án tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

## [Chưa phát hành]

### Added

- **2 người SONG SONG — hai game độc lập trên một máy** (nút "🎮 2 người song song" ở bản đồ →
  trang `multi.html`): nạp game nhiều lần trong các khung `<iframe>` cạnh nhau, **mỗi khung một
  HỒ SƠ LƯU RIÊNG** (tiến trình/xu/cửa hàng/cài đặt tách rời hoàn toàn, không phụ thuộc cửa/thời
  điểm) + **một tay cầm riêng** (gán theo chỉ số). Game đọc URL `?p=<hồ sơ>&pad=<tay cầm>`; lưu
  namespace theo hồ sơ (`adv_pg_<p>`, `adv_slots_<p>`) qua `localStorage` (bền trên mọi trình
  duyệt) + tương thích `window.storage`. Thêm/bớt 1–4 người. Chơi đơn không đổi.
  Khung hồ sơ **chỉ hiện MÀN GAME** (ẩn tiêu đề + nút công cụ + nút cảm ứng) lấp đầy iframe;
  `multi.html` có nút **⛶ Toàn màn hình**. **Ẩn nút cảm ứng ở MỌI chế độ** trên máy tính
  (con trỏ chuột / khi dùng bàn phím / tay cầm) — kể cả toàn màn hình; chỉ **thiết bị cảm ứng**
  mới hiện nút. Toàn màn hình khi ẩn nút thì màn game dùng hết chiều cao.
- **Chia đôi màn — 2 người 1 máy, cùng lúc** (từ màn "⚔️ Đấu 2 người" → "🖥️ Chia đôi màn"):
  hai người chạy CÙNG cửa, CÙNG seed, mỗi người một nửa màn (trên/dưới). Tái dùng nguyên
  engine bằng cách **hoán đổi biến toàn cục `G`** giữa hai trạng thái (g1/g2) mỗi khung, vẽ
  mỗi người vào một viewport. Phím **P1 = mũi tên + ⇧phải/“/” đánh**, **P2 = W A S D + F/⇧trái**
  (P2 cũng dùng được tay cầm). **Mỗi người một luồng ngẫu nhiên riêng gieo cùng seed** →
  cùng đường đua dù đè quái/nhảy khác nhau. Không đụng tiến trình thật. Logic kiểm chứng bằng
  `tests/split.test.js`; **phần hiển thị cần thử trên trình duyệt** (harness không vẽ thật).
- **Chơi + duyệt menu bằng tay cầm (Gamepad API)** — đọc `navigator.getGamepads()` mỗi
  khung, phát hiện cạnh nhấn. **Trong màn chơi**: gọi thẳng `jump/attack/setMove` cho mượt;
  ✕/◯ nhảy · ▢/△ đánh · Start tạm dừng · Select chơi lại. **Trong menu** (bản đồ/cửa hàng/
  cài đặt/kết quả/tạm dừng): một bộ **điều hướng con trỏ theo hình học** — D-pad dời ô chọn
  giữa các nút DOM đang hiện (chọn theo nút gần nhất về hướng bấm), ✕ chọn · ◯ quay lại ·
  △ mở cài đặt. Không viết lại logic menu — chỉ dời `focus()` rồi gọi `.click()` của nút có
  sẵn, nên **mọi màn nút-DOM tự động dùng được** (kể cả Đấu 2 người). Có vòng sáng vàng cho
  ô đang chọn; nhường bàn phím khi đang gõ vào ô chữ. Không thêm thư viện. Đã kiểm tra thật
  trên trình duyệt (di chuyển trong game + thuật toán chọn nút menu) và với tay cầm **PS3
  qua DsHidMini** (standard mapping). Kèm `tools/gamepad-test.html` để soi/khớp nút khi dùng
  tay cầm không chuẩn.

- **Chế độ Đấu 2 người (luân phiên cùng máy)** — nút "⚔️ Đấu 2 người" ở màn bản đồ:
  chọn cửa → Người 1 chơi → Người 2 chơi **CÙNG cửa, CÙNG mã đua (seed)** → so bảng kết quả
  (qua cửa / xa hơn / nhanh hơn / nhiều xu). Công bằng: luồng ngẫu nhiên vật cản tách riêng +
  dt cố định nên hai người gặp **cùng đường đua bất kể cách chơi**. **Không đụng tiến trình
  thật** (xu/mở khoá/độ bền giữ nguyên; `save()` khoá trong lúc đấu). Kiểm chứng bằng
  `tests/versus.test.js` (công bằng + không làm hỏng tiến trình).
- **Nền tảng chế độ thi đấu — RNG gieo hạt** (`src/core/rng.js`): bộ ngẫu nhiên tất định
  (mulberry32 + băm seed từ chuỗi). Kèm **proof-of-concept** (`tests/seeded-stage.test.js`)
  chứng minh trên chính game: **cùng seed → màn chơi y hệt** (bố trí vật cản/quái) ở nhiều
  thế giới, seed khác → khác. Đây là điều kiện tiên quyết cho mọi hình thức đua công bằng
  (luân phiên / chia màn / xếp hạng online / đua live).

### Fixed

- **Quái biết LAO "bay ra rồi biến mất đột ngột"** (dơi rừng `batX` chương 6, cú vọ `owl`
  băng tuyết, `drone`/`orb` vũ trụ): khi lao, AI đặt `m.by=m.y` nhưng vòng lặp vẫn cộng dao
  động sin lên → vòng phản hồi làm `m.by` trôi khỏi màn hình (tới ~627 hoặc ~-156). Nay
  KHÔNG áp dao động khi đang lao — quái lao mượt về phía người chơi, luôn trong màn hình.
  Kiểm chứng bằng `tests/mob-dive.test.js`.

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
