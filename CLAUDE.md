# CLAUDE.md — Hướng dẫn cho AI làm việc trên dự án này

> Tệp này được Claude Code / Cursor / Copilot đọc tự động ở mỗi phiên.
> Sửa tệp này = thay đổi cách AI làm việc. Giữ nó ngắn và chính xác.

## 1. Dự án là gì

**Bé Phiêu Lưu** — game chạy vượt chướng ngại 2D trên trình duyệt, viết bằng
HTML5 Canvas + JavaScript thuần. 60 cửa chia 6 thế giới, 6 trùm cuối,
3 bộ đồ hoạ có thể đổi qua lại.

Người chơi chính: **trẻ 6–10 tuổi**. Người phát triển: bố của bé.
Vì vậy có chế độ độ khó 3 mức (Bé / Thường / Người lớn).

## 2. Nguyên tắc bất di bất dịch

1. **Vanilla JavaScript. Không React, Vue, framework nào.** Canvas 2D thuần.
2. **Không thư viện đồ hoạ.** Mọi hình vẽ bằng lệnh Canvas trong `src/render/`.
3. **Không tệp ảnh, không tệp âm thanh.** Đồ hoạ vẽ bằng code, âm thanh sinh
   bằng Web Audio API. Toàn bộ game phải đóng gói được thành **một tệp .html duy nhất**.
4. **Dữ liệu tách khỏi mã.** Thêm cửa / quái / vật cản / trang bị = sửa
   `src/data/`, KHÔNG sửa `src/systems/`.
5. **Mỗi thay đổi phải chạy qua `npm test`** trước khi coi là xong.
6. **Trả lời bằng tiếng Việt.** Mã nguồn, tên biến, tên tệp bằng tiếng Anh.
   Chú thích trong code bằng tiếng Việt.

## 3. Cấu trúc thư mục

```
src/
  core/       vòng lặp game, input, âm thanh, lưu/tải, máy trạng thái màn hình
  data/       ⭐ DỮ LIỆU THUẦN: stages, mobs, obstacles, gear, palettes
  systems/    vật lý từng thế giới, sinh vật cản, chiến đấu, AI trùm
  render/     vẽ: scene / obstacle / mob / boss / hero / item / hud
  ui/         màn hình bản đồ, cửa hàng, cài đặt, tạm dừng, kết quả
tools/        bộ chạy thử không cần trình duyệt (headless harness)
tests/        kiểm thử tự động
docs/         tài liệu thiết kế
legacy/       bản HTML một tệp cũ, chỉ để tham chiếu, KHÔNG sửa
```

## 4. Quy ước bắt buộc

### Toạ độ
- Canvas logic **900 × 500**. Mặt đất `GY = 408`. Nhân vật đứng ở `KX ≈ 180`.
- Canvas thật = logic × `RS` (1.5) cho nét khi phóng to. Mọi lệnh vẽ dùng toạ độ logic.

### Thế giới
`worldOf(stageIndex)` trả về 0..5:
`0 mặt đất · 1 đại dương · 2 vũ trụ · 3 băng tuyết · 4 cống ngầm · 5 rừng già`

Mỗi thế giới có nhánh vật lý riêng trong `systems/physics.js` và bộ trang bị
riêng trong `data/gear.js`. **Không dùng chung chỉ số trang bị giữa các thế giới.**

### Đồ hoạ
Mọi thứ nhìn thấy đi qua bảng đăng ký `render/registry.js`:
```js
GFX = { scene, obs, mob, boss, hero, item, hazard, palette }
```
Thêm bộ đồ hoạ mới = thêm một mục vào bảng + một tệp trong `render/skins/`.

### Tách lớp thị giác (BẮT BUỘC)
- Vẽ nền → gọi `hazePass()` phủ sương → mới vẽ vật tương tác.
- Vật cản / quái / trùm / nhân vật vẽ trong `POP.on() … POP.off()` (bóng đổ).
- Vật đứng trên đất phải có `contactShadow()`.
- Tương phản vật cản với nền **≥ 2:1**; chữ trên nút **≥ 3:1**.

## 5. Danh sách lỗi đã từng mắc — KIỂM TRA TRƯỚC KHI COMMIT

Đây là lỗi thật đã xảy ra trong quá trình phát triển. Đừng lặp lại.

| # | Lỗi | Cách tránh |
|---|-----|-----------|
| 1 | Mở khoá cửa dùng số cứng `Math.min(10, n+1)` → kẹt ở cửa 10, 20 | Luôn dùng `ST.length` |
| 2 | Nhịp nhạc `0.24 - 0.008*n` → âm từ cửa 30 → Web Audio ném lỗi, chết luôn tiếng | Kẹp mọi tham số âm thanh trong `tone()` |
| 3 | Giai đoạn trùm dùng ngưỡng tuyệt đối `hp>8` → trùm 42 máu ở GĐ1 suốt trận | Ngưỡng theo **tỉ lệ** `hp/max`, và chỉ tăng không lùi |
| 4 | Trùm hồi máu nhảy ngược về giai đoạn dễ rồi hồi mãi | `ph = Math.max(ph, newPh)` |
| 5 | Cây đung đưa lấy **toạ độ x** làm pha → rung giật khi cuộn | Dao động theo **thời gian** `G.t`, không theo vị trí |
| 6 | Quái vẽ quay mặt sang phải nhưng di chuyển sang trái → chạy giật lùi | Bọc `faceLeft()`; vạch ngắm vẽ ngoài phần lật |
| 7 | Ngồi chỉ có ở `kidVector`, thiếu ở `kidMC` → bản Minecraft không cúi | Mọi cơ chế phải cài cho **đủ 3 bộ đồ hoạ** |
| 8 | Hộp va chạm khi ngồi chỉ kiểm tra `sewer`, thiếu `jungle` | Kiểm tra tất cả thế giới có cơ chế đó |
| 9 | Thanh máu trùm và thanh tài nguyên cùng ở giữa đáy → đè nhau | Kiểm tra va chạm ô HUD bằng `tools/hud-check.mjs` |
| 10 | Nút có `class="danger"` (nền đỏ) + `style="color:red"` → chữ đỏ trên nền đỏ | Không viết `style` màu đè lên class |
| 11 | Thanh máu trùm vẽ trong lớp rung màn hình → giật theo | HUD vẽ **sau** `ctx.restore()` |
| 12 | Vật phẩm mới thiếu hình pixel cho bộ Minecraft → ném lỗi `undefined.rows` | Thêm vào `SPR` + có nhánh dự phòng |
| 13 | Nút bấm đặt `position:absolute` đè lên canvas → che thanh tim | Nút điều khiển nằm **ngoài** khung canvas |

## 6. Quy trình làm một việc

1. Đọc `docs/GAME-DESIGN.md` phần liên quan.
2. Sửa **dữ liệu trước** (`src/data/`), chỉ sửa `systems/` khi cần cơ chế mới.
3. Chạy `npm test` — phải xanh hết.
4. Chạy `npm run check:balance` nếu động vào số liệu cân bằng.
5. Chạy `npm run build` — phải ra `dist/game.html` chạy được.
6. Ghi lại thay đổi vào `docs/CHANGELOG.md`.

## 7. Việc KHÔNG được tự ý làm

- Không đổi `GY`, `KX`, kích thước canvas (làm hỏng toàn bộ số liệu cân bằng).
- Không thêm thư viện ngoài nếu chưa hỏi.
- Không xoá hoặc đổi định dạng **mã lưu tiến trình** (`BPL1-…`) — người chơi
  đang giữ mã cũ. Nếu buộc phải đổi, tăng lên `BPL2` và giữ bộ đọc `BPL1`.
- Không đặt nội dung bạo lực / đáng sợ. Người chơi là trẻ nhỏ.
