# BẮT ĐẦU TỪ ĐÂY

Bố mới nhận bộ khung này. Làm đúng 6 bước dưới đây trong khoảng 30 phút.

## Bước 1 — Cài công cụ (một lần duy nhất)

Mở PowerShell trên Windows 11:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

Đóng PowerShell, mở lại, kiểm tra:
```powershell
node -v     # phải ≥ v20
git --version
```

Cài Claude Code:
```powershell
npm install -g @anthropic-ai/claude-code
```

## Bước 2 — Đặt dự án vào chỗ cố định

```powershell
cd D:\
mkdir game
cd game
# giải nén bộ khung này vào đây, sao cho thấy CLAUDE.md ở ngay thư mục gốc
git init
git add -A
git commit -m "khung dự án ban đầu"
```

## Bước 3 — Mở Claude Code và để nó tự đọc dự án

```powershell
claude
```

Prompt đầu tiên:
```
Đọc CLAUDE.md, README.md và docs/ARCHITECTURE.md.
Rồi tóm tắt cho tôi: dự án này là gì, cấu trúc ra sao, và bước tiếp theo
theo docs/PROMPTS.md là gì. CHƯA VIẾT CODE.
```

Nếu nó tóm tắt đúng → bố đã sẵn sàng.

## Bước 4 — Chạy giai đoạn 1

Mở `docs/PROMPTS.md`, chép nguyên prompt của **GIAI ĐOẠN 1**, dán vào Claude Code.
Xong thì:

```powershell
npm run build
```
Phải ra `dist/game.html`. Mở tệp đó bằng trình duyệt.

```powershell
git add -A
git commit -m "giai đoạn 1: khung Vite"
```

## Bước 5 — Làm tiếp giai đoạn 2, 3, 4…

Mỗi giai đoạn: dán prompt → đợi xong → `npm test` → `git commit`.

**Quy tắc vàng: commit trước mỗi prompt.** Nếu AI làm hỏng:
```powershell
git reset --hard
```

## Bước 6 — Đưa lên GitHub (khuyến nghị)

```powershell
git remote add origin https://github.com/<tên-của-bố>/be-phieu-luu.git
git push -u origin main
```

Từ đó mỗi lần push, GitHub tự chạy kiểm thử (`.github/workflows/ci.yml`)
và báo xanh/đỏ.

---

## Thứ tự đọc tài liệu

| Lúc nào | Đọc gì |
|---|---|
| Ngay bây giờ | `docs/START-HERE.md` (tệp này) |
| Trước khi ra lệnh cho AI | `docs/PROMPTS.md` |
| Khi muốn hiểu game chạy thế nào | `docs/ARCHITECTURE.md` |
| Khi muốn thêm nội dung | `docs/GAME-DESIGN.md` |
| AI đọc tự động mỗi phiên | `CLAUDE.md` |

## Ba câu lệnh cần nhớ

```powershell
npm run dev          # chơi thử, tự nạp lại khi sửa code
npm test             # kiểm thử tự động, KHÔNG cần mở trình duyệt
npm run build        # đóng gói thành dist/game.html một tệp
```
