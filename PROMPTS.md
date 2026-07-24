# Sổ tay prompt — triển khai dự án từng bước

Mỗi giai đoạn có: **mục tiêu → prompt dán thẳng cho AI → cách kiểm tra**.
Xong giai đoạn nào thì `git commit` giai đoạn đó rồi mới sang bước sau.
**Không gộp nhiều giai đoạn vào một prompt.**

---

## GIAI ĐOẠN 0 — Máy tính sẵn sàng

Trên Windows 11:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
npm install -g @anthropic-ai/claude-code
```

Kiểm tra: `node -v` (≥ 20), `git --version`, `claude --version`.

```bash
mkdir be-phieu-luu && cd be-phieu-luu
git init
claude
```

---

## GIAI ĐOẠN 1 — Dựng khung dự án

**Prompt:**
```
Tôi bắt đầu dự án game HTML5 Canvas thuần JavaScript, KHÔNG framework.
Hãy dựng khung dự án với Vite:

1. package.json với script: dev, build, preview, test, lint
2. Vite + plugin vite-plugin-singlefile để `npm run build` gộp toàn bộ
   JS/CSS vào MỘT tệp dist/game.html, mở trực tiếp bằng file:// vẫn chạy
3. Vitest cho kiểm thử
4. ESLint + Prettier tối giản
5. .gitignore chuẩn Node
6. Thư mục rỗng: src/{core,data,systems,render,ui}, tools, tests, docs, legacy

KHÔNG viết code game. Chỉ dựng khung.
Xong thì chạy `npm install` và `npm run build` để chứng minh khung chạy được.
```

**Kiểm tra:** có `dist/game.html`, mở bằng trình duyệt không lỗi console.

---

## GIAI ĐOẠN 2 — Nạp mã cũ, tách DỮ LIỆU trước

Chép tệp game hiện tại vào `legacy/game.html`.

**Prompt:**
```
legacy/game.html là toàn bộ game hiện tại (một tệp, ~5000 dòng JS).
Đọc nó và CHỈ tách phần DỮ LIỆU THUẦN ra src/data/, chưa động tới logic:

- data/stages.js    mảng ST (60 cửa) + hằng W,H,GY,KX,CEIL,CEIL3,VTOP
- data/obstacles.js bảng OBS
- data/mobs.js      bảng MOB
- data/gear.js      6 bộ vũ khí/giáp + bảng độ bền DUR
- data/palettes.js  TH, MCT, SEAT, SPT, ICET, SEWT, JGT, DORA, VNP, HAZE
- data/difficulty.js DIFF

Yêu cầu:
- export named, chú thích tiếng Việt giải thích từng trường
- KHÔNG đổi một giá trị số nào
- Viết tests/data.test.js kiểm: đúng 60 cửa, n tăng dần 1..60, mỗi thế giới
  10 cửa, mọi cửa có goal>0 và sp là 3 số tăng dần, mọi tên vật cản/quái
  dùng trong ST đều tồn tại trong OBS/MOB

Chạy npm test để chứng minh.
```

**Kiểm tra:** `npm test` xanh. Bước an toàn nhất — làm trước để quen quy trình.

---

## GIAI ĐOẠN 3 — Bộ chạy thử không cần trình duyệt ⭐

Đây là **thứ quan trọng nhất cả dự án**. Không có nó, AI không tự kiểm chứng được
và bố phải tự mở trình duyệt bấm thử từng lần.

**Prompt:**
```
Tạo tools/harness.mjs — giả lập DOM + Canvas + Web Audio để chạy game trong
Node, không cần trình duyệt:

- Giả lập document.getElementById/createElement/querySelectorAll, classList, style
- Giả lập CanvasRenderingContext2D bằng Proxy: lệnh vẽ là no-op, nhưng
  createLinearGradient trả {addColorStop}, measureText trả {width}
- Giả lập AudioContext KIỂM TRA NGHIÊM: nếu setValueAtTime hoặc
  exponentialRampToValueAtTime nhận thời gian âm/NaN thì ghi vào mảng lỗi
  (đúng như trình duyệt thật sẽ ném lỗi)
- Chặn setTimeout để vòng lặp nhạc không chạy vô hạn
- Bắt requestAnimationFrame, xuất hàm frames(n) chạy n khung hình
- Xuất API: loadGame(path), startStage(i), press(key), release(key),
  frames(n), state(), audioErrors()

Rồi tạo tests/smoke.test.js: chạy toàn bộ 60 cửa × 3 bộ đồ hoạ, mỗi cửa
200 khung hình, khẳng định không ngoại lệ và audioErrors() rỗng.
```

**Kiểm tra:** `npm test` chạy 180 lượt, xanh.

---

## GIAI ĐOẠN 4 — Tách lõi engine

**Prompt:**
```
Tách lõi khỏi legacy/game.html sang src/core/, giữ nguyên hành vi:

- core/loop.js   vòng lặp rAF, dt kẹp ≤ 0.033, gọi update/draw
- core/input.js  bảng KEYMAP + bàn phím + nút cảm ứng
- core/audio.js  tone() PHẢI KẸP THAM SỐ (xem CLAUDE.md lỗi #2) + nhạc nền
- core/save.js   mã lưu BPL1 xuất/nhập, tự lưu, đọc được mã cũ
- core/state.js  máy trạng thái màn hình map/shop/set/play/pause/result

Viết test: tone() không bao giờ ném lỗi với đầu vào âm/NaN/Infinity/0;
mã lưu xuất rồi nhập lại khớp 100% mọi trường.
```

---

## GIAI ĐOẠN 5 — Tách hệ thống chơi

**Prompt:**
```
Tách logic sang src/systems/:

- systems/physics.js 6 nhánh vật lý theo thế giới (chạy-nhảy / bơi / đảo
  trọng lực / trượt băng / platform+ngồi / đu dây). Mỗi nhánh là hàm riêng,
  dispatch bằng BẢNG chứ không phải if-else lồng nhau.
- systems/spawner.js sinh vật cản, quái, vật phẩm theo cấu hình cửa
- systems/combat.js  va chạm, đè đầu, chém, sát thương, hao độ bền
- systems/boss.js    máy trạng thái trùm; giai đoạn theo TỈ LỆ máu, CHỈ TĂNG

Giữ nguyên mọi hằng số. Xong chạy lại smoke test phải y hệt.
```

**Kiểm tra:** so quãng đường sau 500 khung ở cửa 1 trước/sau khi tách — phải bằng nhau.

---

## GIAI ĐOẠN 6 — Tách đồ hoạ theo bảng đăng ký

**Prompt:**
```
Tách phần vẽ sang src/render/:

- render/registry.js bảng GFX (scene/obs/mob/boss/hero/item/hazard)
- render/layers.js   HAZE, POP, contactShadow, hazePass
- render/skins/doraemon.js, minecraft.js, vietnam.js
- render/worlds/land.js, sea.js, space.js, ice.js, sewer.js, jungle.js
- render/hud.js      HUD + hàm layoutHUD() trả về danh sách ô để kiểm va chạm

Viết tools/hud-check.mjs: với mọi loại cửa và số tim từ 2 đến 9, tính các ô
HUD và khẳng định không ô nào chồng nhau.
```

---

## GIAI ĐOẠN 7 — Kiểm tra cân bằng tự động

**Prompt:**
```
Tạo tools/balance.mjs in bảng cân bằng và cảnh báo khi vượt ngưỡng:

1. Mỗi cửa: tốc độ tối đa, khoảng cách vật cản nhỏ nhất, tầm nhảy
   (v0=640, g=1900, giữ nút g=950). Cảnh báo nếu khoảng cách < tầm nhảy
   tối thiểu → cửa không thể qua.
2. Mỗi trùm × 3 mức khó × 3 cấp vũ khí: ước lượng thời gian hạ.
   Cảnh báo nếu > 180 giây hoặc < 15 giây.
3. Tương phản màu: mọi cặp (vật cản, nền cùng thế giới) ≥ 2:1;
   mọi cặp (chữ nút, nền nút) ≥ 3:1. In bảng theo chuẩn WCAG.

Chạy bằng `npm run check:balance`.
```

---

## GIAI ĐOẠN 8 — Tự động hoá và phát hành

**Prompt:**
```
1. .github/workflows/ci.yml: mỗi lần push chạy npm ci, lint, test, build
2. Workflow deploy dist/game.html lên GitHub Pages khi push nhánh main
3. Số phiên bản đọc từ package.json, hiện ở tiêu đề game
4. docs/CHANGELOG.md theo định dạng Keep a Changelog
```

---

## GIAI ĐOẠN 9 — Mẫu prompt thêm chương mới

Từ đây mỗi chương mới chỉ cần một prompt theo mẫu:

```
Thêm THẾ GIỚI 7: <bối cảnh>.

Cơ chế mới: <mô tả cơ chế chưa từng có>.
10 cửa: <tên cửa 1> … <tên cửa 10>, khó dần.
Trùm: <tên>, <số> máu, 3 giai đoạn, chiêu: <liệt kê>.
Quái: <5–6 loài>.  Vật cản: <liệt kê>.
Trang bị riêng: 3 cấp vũ khí, 3 cấp giáp, 2 phụ kiện.

Thứ tự bắt buộc:
1. data/stages.js thêm 10 cửa
2. data/obstacles.js, mobs.js, gear.js thêm mục
3. systems/physics.js thêm nhánh nếu có cơ chế mới
4. render/worlds/<tên>.js vẽ cảnh cho CẢ 3 bộ đồ hoạ
5. render/registry.js đăng ký
6. ui/ thêm tab bản đồ và quầy cửa hàng
7. tests/ thêm kiểm thử cơ chế mới

Sau mỗi bước chạy npm test.
Đối chiếu danh sách 13 lỗi trong CLAUDE.md trước khi báo hoàn thành.
```

---

## Mẹo dùng Claude Code

| Tình huống | Cách xử lý |
|---|---|
| Việc lớn | Chia nhiều prompt nhỏ, mỗi prompt một tệp / một chức năng |
| AI sửa lung tung | `git commit` trước mỗi prompt; sai thì `git reset --hard` |
| Muốn AI tự kiểm | Luôn kết prompt bằng "chạy npm test để chứng minh" |
| AI quên quy ước | Nhắc: "đọc lại CLAUDE.md mục 5 trước khi sửa" |
| Cần bàn trước | Mở đầu bằng "chỉ phân tích, chưa viết code" |
| Ngữ cảnh đầy | Gõ `/compact`, hoặc mở phiên mới trỏ vào tệp cụ thể |
| Muốn AI đọc file lớn | "đọc legacy/game.html dòng 1200–1600" thay vì cả tệp |
