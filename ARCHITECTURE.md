# Kiến trúc

## Sơ đồ luồng một khung hình

```
requestAnimationFrame
  └─ loop.js
      ├─ dt = min(0.033, thời gian trôi)
      ├─ nếu đang chơi:
      │   update(dt)
      │     ├─ physics[world](dt)      ← 6 nhánh, chọn theo worldOf(stage)
      │     ├─ spawner.tick(dt)        ← sinh vật cản / quái / vật phẩm
      │     ├─ combat.tick(dt)         ← va chạm, sát thương, độ bền
      │     └─ boss.tick(dt)           ← nếu là cửa trùm
      └─ draw()
          ├─ ctx.setTransform(RS,0,0,RS,0,0)   ← nét khi phóng to
          ├─ [lớp rung màn hình]
          │   ├─ GFX.scene[world](skin)  → hazePass()   ← NỀN bị phủ sương
          │   ├─ POP.on() … vật cản … POP.off()
          │   ├─ POP.on() … quái … POP.off()
          │   ├─ POP.on() … vật phẩm … POP.off()
          │   ├─ bẫy (cột lửa / xúc tu / cọc băng / tia plasma)
          │   ├─ POP.on() … nhân vật … POP.off()
          │   └─ hạt hiệu ứng
          └─ [ngoài lớp rung] HUD          ← không bao giờ giật
```

## Vì sao tách lớp như vậy

Vấn đề lớn nhất của game 2D vẽ tay là **vật cản lẫn vào nền**. Giải pháp gồm 3 tầng:

1. `hazePass()` phủ một lớp màu trời bán trong suốt lên toàn bộ nền → nền nhạt đi, lùi ra sau.
2. `POP` bọc mọi vật tương tác trong bóng đổ → nổi lên trước.
3. Bảng màu tách biệt: nền nhạt/lạnh, vật cản đậm/ấm/bão hoà cao có viền tối.

Muốn chỉnh "độ nổi" của vật cản: sửa `HAZE` và `POP` trong `render/layers.js`,
không phải đi sửa từng hàm vẽ.

## Bảng đăng ký đồ hoạ

```js
// render/registry.js
export const GFX = {
  scene : { land, sea, space, ice, sewer, jungle },  // mỗi hàm nhận (skin)
  obs   : { land, sea, space, ice, sewer, jungle },
  mob   : { land, sea, space, ice, sewer, jungle },
  boss  : { dragon, kraken, robot, titan, rat, monkey },
  hero  : { vector, blocky },   // vector cho Doraemon+Việt, blocky cho Minecraft
  item  : drawItem,
  hazard: { pillar, whirl, gzone, vine },
  palette: { ... }
};
```

**Thêm bộ đồ hoạ mới** = thêm một tệp `render/skins/<tên>.js` + một cột trong bảng.
**Thêm thế giới mới** = thêm một hàng.

## Các thế giới và cơ chế riêng

| # | Thế giới | Cơ chế đặc trưng | Tài nguyên riêng |
|---|----------|------------------|------------------|
| 0 | Mặt đất | chạy, nhảy, đáp nhanh | — |
| 1 | Đại dương | bơi lên/chìm xuống theo nút giữ | 🫧 oxy |
| 2 | Vũ trụ | trọng lực thấp, nhảy đôi, **đảo trọng lực** | — |
| 3 | Băng tuyết | **trượt theo quán tính**, gió bão | 🔥 giữ ấm |
| 4 | Cống ngầm | **vực rơi là thua**, ngồi chui, platform | — |
| 5 | Rừng già | **đu dây con lắc**, platform, ngồi | 🍃 năng lượng |

Mỗi thế giới có **bộ trang bị riêng** (vũ khí/giáp/2 phụ kiện) không dùng chung.

## Hệ toạ độ

- Canvas logic **900 × 500**, canvas thật nhân `RS = 1.5`.
- `GY = 408` mặt đất · `KX ≈ 180` vị trí nhân vật · `CEIL = 92` trần nước ·
  `CEIL3 = 118` trần vũ trụ · `VTOP = 74` điểm treo dây leo.
- Thế giới cuộn sang trái; nhân vật đứng gần như cố định.
  Quái đi sang trái nên **phải vẽ quay mặt sang trái** (dùng `faceLeft()`).

## Cân bằng nhảy — công thức gốc

```
v0 = 640 px/s          vận tốc bật lên
g  = 1900 px/s²        trọng lực thường
g  = 950  px/s²        khi GIỮ nút (nhảy cao)

Nhả sớm : thời gian bay = 2·v0/g       = 0.67 s → tầm xa = 0.67 × tốc_độ
Giữ nút : cao nhất = v0²/(2·950) = 216 px, thời gian bay ≈ 1.15 s
```

Vực rộng hơn `0.67 × tốc_độ` thì **bắt buộc phải giữ nút**. `tools/balance.mjs`
kiểm tra tự động điều này cho cả 60 cửa.

## Lưu tiến trình

- Tự lưu qua `window.storage` (nếu môi trường có), bọc `try/catch`.
- **Mã lưu `BPL1-<checksum>-<base64>`** để chuyển máy / chuyển phiên bản.
  Định dạng này là **hợp đồng công khai** — không được phá.
