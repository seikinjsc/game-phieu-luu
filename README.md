# Bé Phiêu Lưu

Game chạy vượt chướng ngại 2D cho trẻ 6–10 tuổi. HTML5 Canvas, JavaScript thuần,
không framework, không tệp ảnh/âm thanh. Đóng gói thành **một tệp .html** chạy được offline.

## Chạy thử

```bash
npm install
npm run dev        # mở http://localhost:5173
```

## Đóng gói

```bash
npm run build      # tạo dist/game.html — gửi tệp này là chơi được
```

## Kiểm tra

```bash
npm test              # kiểm thử tự động (chạy game không cần trình duyệt)
npm run check:balance # bảng cân bằng 60 cửa + 6 trùm
npm run check:hud     # dò các ô giao diện có chồng nhau không
npm run check:all     # chạy tất cả
```

## Tài liệu

| Tệp | Nội dung |
|---|---|
| `CLAUDE.md` | Hướng dẫn cho AI — đọc đầu tiên |
| `docs/PROMPTS.md` | **Sổ tay prompt triển khai từng bước** |
| `docs/ARCHITECTURE.md` | Kiến trúc, luồng vẽ, bảng đăng ký đồ hoạ |
| `docs/GAME-DESIGN.md` | Thiết kế: 6 thế giới, 60 cửa, cân bằng |
| `docs/CHANGELOG.md` | Nhật ký thay đổi |

## Quy tắc vàng

1. Sửa **dữ liệu** (`src/data/`) trước, sửa **logic** (`src/systems/`) sau.
2. Mọi thay đổi phải qua `npm test`.
3. Đọc mục 5 của `CLAUDE.md` (13 lỗi đã từng mắc) trước khi commit.
