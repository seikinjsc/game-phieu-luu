# Tài liệu thiết kế — Bé Phiêu Lưu

## Định vị

Game chạy vượt chướng ngại 2D, chơi bằng trình duyệt, một tệp HTML duy nhất.
Đối tượng chính **trẻ 6–10 tuổi**, có chế độ Người lớn cho phụ huynh.

## Ba trụ cột thiết kế

1. **Mỗi chương một cơ chế điều khiển hoàn toàn khác** — không phải đổi da.
   Người chơi phải học lại cách di chuyển ở mỗi thế giới.
2. **Luôn có đường thắng** — trùm ở giai đoạn cuối yếu đi (kiệt sức / hết hồi máu),
   vũ khí yếu nhất vẫn hạ được, chỉ lâu hơn.
3. **Thất bại phải công bằng** — có ân huệ mép vực, đệm lệnh nhảy, dấu `!` báo trước
   mọi đòn nguy hiểm, vạch ngắm trước khi quái lao.

## 6 thế giới × 10 cửa

| Cửa | Thế giới | Trùm | Máu | Cơ chế học được |
|-----|----------|------|-----|-----------------|
| 1–10 | 🌍 Mặt đất | 🐲 Rồng | 12 | nhảy, giữ nút nhảy cao, đè đầu quái |
| 11–20 | 🌊 Đại dương | 🐙 Thuỷ Quái | 22 | bơi theo nút giữ, quản lý oxy |
| 21–30 | 🚀 Vũ trụ | 🤖 Robot Chúa Tể | 26 | nhảy đôi, đảo trọng lực |
| 31–40 | ❄️ Băng tuyết | 🧊 Ma Vương Băng Giá | 32 | trượt quán tính, giữ ấm, khe băng |
| 41–50 | 🕳️ Cống ngầm | 🐀 Chuột Cống Chúa | 38 | vực chết, ngồi chui, platform |
| 51–60 | 🌴 Rừng già | 🐵 Khỉ Chúa | 42 | đu dây con lắc, năng lượng |

## Ba mức độ khó

| | 🧸 Bé | ⚔️ Thường | 💀 Người lớn |
|---|---|---|---|
| Tốc độ | ×0.88 | ×1 | ×1.20 |
| Khoảng cách vật cản | ×1.18 | ×1 | ×0.84 |
| Máu quái (từ chương 2) | | | +1 |
| Tần suất quái | thưa | | dày ×1.5 |
| Bảo bối | dễ gặp | | hiếm ×1.35 |
| Tim khởi đầu | +2 | | −1 |
| Máu trùm | ×0.8 | ×1 | ×1.4 |
| Nhịp bắn của trùm | chậm | | nhanh ×1.45 |

## Cấu trúc một trận trùm

Ba giai đoạn chia theo **tỉ lệ máu** (>66% · 66–33% · <33%), **chỉ tăng không lùi**.

- **GĐ 1** — dạy người chơi nhận ra "cửa sổ đánh": trùm chỉ bị thương khi lao xuống.
- **GĐ 2** — thêm quái con, thêm bẫy địa hình, trùm phản đòn khi bị chém.
- **GĐ 3** — nhanh nhất, thêm một chiêu đặc biệt, nhưng **bỏ khả năng phòng thủ**
  (Khỉ Chúa hết hồi máu, các trùm khác tăng nhịp nhưng không tăng phòng ngự).

## Kinh tế

- Xu kiếm từ: quãng đường, vật phẩm, hạ quái, thưởng qua cửa (thua vẫn được 40%).
- Tiêu vào: 6 quầy trang bị theo thế giới, mỗi quầy 3 cấp vũ khí + 3 cấp giáp
  + 2 phụ kiện.
- **Mọi trang bị đều có độ bền** và hỏng dần → xu luôn có chỗ tiêu, không bị
  "mua xong là hết việc".

## Trợ năng

- Tách riêng công tắc nhạc nền và hiệu ứng.
- Tắt được rung màn hình.
- Tương phản chữ trên nút ≥ 3:1 (chuẩn WCAG cho chữ lớn).
- 32 phím bàn phím cho 9 hành động (mũi tên / WASD / ZX / JK / bàn phím số).
- Chế độ Bé: chậm hơn, nhiều tim hơn, vật cản thưa hơn.
