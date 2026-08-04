# Mê Cung góc nhìn NHẬP VAI — phân tích yêu cầu và đánh giá hạ tầng

> Tài liệu NGHIÊN CỨU. Viết 2026-08-03.
> Mục đích: trả lời một câu duy nhất — **làm được tới đâu, với hạ tầng đang có?**

## 0. Quyết định đã chốt (2026-08-03)

1. **Mô hình di chuyển: A1** — giữ nguyên đi từng tâm ô sang tâm ô, chỉ thêm góc nhìn `yaw`
   và nội suy camera cho mượt. Không đụng một dòng logic nào, 36 test của `maze-run` sống
   nguyên, không bao giờ kẹt góc. Phương án A2/A3 **không làm** trừ khi có yêu cầu mới.
2. **Hai góc nhìn sống song song** — thêm nút "Góc nhìn: Trên xuống / Nhập vai" ở màn chọn.
   Bản 2D được giữ lại làm đường lùi cho máy yếu, cho màn hình chia đôi hai người, và cho bé
   nhỏ chưa quen góc nhìn nhập vai. Chỉ tốn một nhánh rẽ ở chỗ vẽ.

Hai quyết định này làm giai đoạn 1 (§6) trở thành **thuần tuý cộng thêm**: không xoá gì,
không sửa logic, không vỡ test. Nếu hiệu năng không đạt thì tắt nút đi là xong, không mất gì.

---

## 1. Tách yêu cầu thành 6 hạng mục đo được

| # | Yêu cầu gốc | Diễn giải kỹ thuật |
|---|---|---|
| A | Hướng nhìn nhập vai, không phải từ trên xuống | Camera đặt tại vị trí nhân vật, có góc quay `yaw` |
| B | Nhìn theo đánh dấu trên tường chỉ đường đi tiếp | Vẽ hình chỉ hướng lên MẶT TƯỜNG của ô kế tiếp trên đường đi |
| C | Quái tạo cảnh báo khi vào gần phạm vi di chuyển | Đo khoảng cách + tầm nhìn thẳng → tín hiệu hình + tiếng |
| D | Đồ hoạ như game 3D | Tường có chiều sâu phối cảnh, có vân, có sương xa |
| E | Câu hỏi là cánh cửa mở vào, hoặc hộp gặp trên đường | Cửa khoá vẽ thành cánh cửa chắn ngang hành lang; ô "?" thành cái hộp |
| F | Vũ khí nhìn thấy được, kiểu Half-Life (thấy 2 tay) | Lớp vẽ tiền cảnh: hai bàn tay + vũ khí, nhún theo bước chân |

---

## 2. Chọn công nghệ: **raycasting trên Canvas 2D**, không phải WebGL

### Ba ràng buộc bất di bất dịch của dự án (CLAUDE.md §2)

1. Vanilla JS, Canvas 2D thuần — không framework.
2. Không thư viện đồ hoạ.
3. Không tệp ảnh, không tệp âm thanh — phải đóng gói thành **một tệp .html**.

### Vì sao raycasting là lựa chọn đúng, không phải lựa chọn "tạm"

Mê cung của dự án là **lưới vuông góc, hành lang rộng đúng 1 ô, tường thẳng đứng, một tầng**.
Đó chính xác là dạng thế giới mà thuật toán raycasting (kiểu Wolfenstein 3D) sinh ra để vẽ.

Điểm quyết định: một bộ raycaster DDA chỉ cần **duy nhất một phép hỏi thế giới** —
"ô (x, y) có phải tường không?". Mà `src/systems/maze.js` đã xuất ra sẵn:

```js
isWall: (x, y) => x < 0 || y < 0 || x >= size || y >= size || grid[y * size + x] === WALL
```

Không phải dựng lưới tam giác, không phải bộ nạp mô hình, không phải cây phân vùng không gian.
Cấu trúc dữ liệu đang có **đã là** cấu trúc dữ liệu lý tưởng. Đây là trường hợp hiếm.

### Vì sao KHÔNG chọn WebGL

WebGL về lý thuyết không vi phạm ràng buộc (nó là tính năng nền tảng, không phải thư viện),
nhưng đổi lại:

- Phải tự viết bộ dựng lưới tam giác từ mê cung, tự viết shader dạng chuỗi, tự quản ma trận.
- Ném bỏ toàn bộ bảng đăng ký `GFX` và mọi mã vẽ bằng lệnh Canvas đang có.
- Ba bộ đồ hoạ (`MAZE_SKINS`) phải vẽ lại từ đầu bằng vân ảnh thay vì bằng lệnh vẽ.
- Diff khổng lồ, mà thứ thu lại được (ánh sáng thật, hình học tự do) thì mê cung vuông góc
  **không dùng đến**.

### Nói thẳng về trần kính của raycasting

Làm được: hành lang có phối cảnh · tường có vân · sương mờ theo khoảng cách · quái/vật phẩm
dạng ảnh dán đứng · hai tay + vũ khí tiền cảnh · nhún đầu theo bước chân · rung màn hình.

**Không** làm được: nhìn ngước lên / cúi xuống thật (chỉ giả được bằng phép trượt dọc) ·
dốc, bậc thang, nhiều tầng · bóng đổ và ánh sáng thật · tường xiên không vuông góc.

Mê cung vuông góc một tầng nên **không có hạn chế nào ở trên thực sự cản trở**. Khoảng cách
thị giác còn lại so với Half-Life nằm ở **chất lượng vân bề mặt**, mà thứ đó bị chặn bởi
ràng buộc #3: không có tệp ảnh, mọi vân phải **sinh bằng mã lúc khởi động** vào canvas ẩn.
Vân sinh bằng mã (gạch, đá, rêu, băng, mạch điện) trông chỉn chu được, nhưng sẽ ra chất
**DOOM/Wolfenstein thời 1993–1996**, không phải chất Half-Life 2004.

> Kết luận hạng mục D: **đạt ~70%** so với hình dung "game 3D". Đủ để một đứa trẻ gọi là 3D,
> không đủ để một người lớn nhầm với game 3D hiện đại.

---

## 3. Đánh giá từng hạng mục

### A. Góc nhìn nhập vai — **làm được, nhưng đây là chỗ khó nhất, và không phải vì đồ hoạ**

Vẽ thì dễ. Vấn đề nằm ở **mô hình di chuyển**, và dự án đã có một bài học đắt giá ghi ngay
trên đầu `src/systems/maze-run.js`:

> Vì sao chọn kiểu này thay vì va chạm hộp tự do: hành lang rộng đúng 1 ô, va chạm tự do
> bắt trẻ 6 tuổi canh đúng tâm mới lách qua được, **kẹt góc liên tục**.

Chuyển sang nhập vai kiểu Half-Life (đi tự do + xoay chuột) là **mang chính xác vấn đề đó
quay lại, và nặng hơn** — vì giờ bé phải canh cả hướng thân người chứ không chỉ vị trí.

Ba phương án, xếp theo rủi ro:

| | Mô hình | Được | Mất |
|---|---|---|---|
| **A1** | Giữ nguyên đi từng ô, chỉ **camera** nội suy mượt + xoay 90° có hoạt ảnh (kiểu Legend of Grimrock) | Không đổi một dòng logic nào. 36 test của `maze-run` sống nguyên. Không bao giờ kẹt góc. | Cảm giác "cứng", không giống Half-Life |
| **A2** | Vị trí và góc nhìn **liên tục**, nhưng có **trợ lái tự canh giữa hành lang** | Mượt như FPS thật, vẫn không kẹt góc | Phải viết va chạm hình tròn trượt tường; ~15 test phải viết lại |
| **A3** | Đi tự do hoàn toàn, xoay bằng chuột | Đúng chất Half-Life | Kẹt góc quay lại; bé 6 tuổi rất khó điều khiển; vỡ định dạng lưu ván (`cx,cy,lx,ly,dir`) |

**Khuyến nghị: A1 trước, A2 sau, không làm A3.** A1 chứng minh được hiệu năng và hình khối mà
không đụng vào lõi; A2 nâng cấp cảm giác sau khi A1 đã chạy thật trên máy của bé.

Một điểm phải giữ bằng mọi giá: cơ chế **bấm vào ô để tự đi tới đó** là xương sống trợ năng
của chế độ này. Ở góc nhìn nhập vai nó phải thành **bấm vào vạch chỉ đường trên tường → tự đi
tới ngã rẽ kế tiếp**. Bỏ nó đi là bỏ rơi người chơi nhỏ tuổi.

### B. Đánh dấu chỉ đường trên tường — **làm được, và dữ liệu đã có sẵn 100%**

`run.hint()` đã trả về ô kế tiếp trên đường tới cửa gần nhất chưa mở, `run.goal()` trả ô đích.
Raycaster khi bắn trúng tường thì biết luôn **ô nào, mặt nào** → dán hình chỉ hướng lên đúng
mặt tường đó là việc tự nhiên.

Hơn nữa `MAZE_DIFF` đã có sẵn trường `compass: 'luon' | 'bam' | 'khong'` cho ba mức khó —
tức là **cơ chế bật/tắt chỉ dẫn theo độ khó đã tồn tại**, chỉ cần đổi cách thể hiện:

- `luon` (mức Dễ) → vạch phát sáng thường trực trên tường mọi ngã rẽ
- `bam` (mức Vừa) → vạch chỉ hiện khi giữ nút, rồi mờ dần
- `khong` (mức Khó) → không có vạch nào

Đây là nâng cấp thật so với cái la bàn hiện tại: chỉ dẫn nằm **trong thế giới** chứ không phải
một mũi tên dán trên HUD.

### C. Cảnh báo quái khi tới gần — **làm được, dữ liệu đã có**

Quái đã có toạ độ liên tục `{x, y}`, đã có `TAM_CHEM = 1.35` và ngưỡng chạm. Cần thêm:
đo khoảng cách + kiểm tầm nhìn thẳng (raycaster cho không mất thêm chi phí) → viền đỏ nhấp
nháy ở rìa màn hình về phía có quái + tiếng cảnh báo (`core/audio.js` đã có `sBoom`, `sHit`).

**Cảnh báo bắt buộc — CLAUDE.md §7 "không đặt nội dung đáng sợ":** ở góc nhìn nhập vai, một
con quái hiện ra trong hành lang tối đáng sợ hơn hẳn so với nhìn từ trên xuống. Bắt buộc:

- Cảnh báo phải đến **TRƯỚC** khi nhìn thấy quái, không bao giờ để quái nhảy ra bất ngờ.
- Quái giữ tạo hình hoạt hình, màu tươi, không bóng tối trên mặt.
- Không có nhạc căng thẳng, không tiếng thở, không bước chân rình rập.

### D. Đồ hoạ 3D — xem §2. **Đạt ~70%.**

Một điểm cộng bất ngờ: cơ chế **tầm nhìn theo mức khó đã ăn khớp sẵn** với góc nhìn nhập vai.
`sight` = 99 / 7 / 4 ô ở ba mức khó — chuyển thẳng thành bán kính đèn và mật độ sương:
mức Dễ sáng cả mê cung, mức Khó chỉ thấy 4 ô quanh mình. Và **đèn pin trong cửa hàng
(`themNhin`) từ một con số vô hình bỗng thành một nón sáng nhìn thấy được** — món đồ đó
cuối cùng cũng có lý do tồn tại về mặt thị giác.

### E. Câu hỏi thành cửa và hộp — **làm được, gần như không đụng logic**

Cửa khoá đã là ô có `loai: 'cua'`, ô thưởng đã là ô có `loai: 'thuong'`. Toàn bộ luồng
`run.pending` → `moCauHoi()` → `traLoi()` / `dongCauHoi()` **giữ nguyên không sửa**.
Chỉ đổi cách vẽ:

- Cửa khoá → cánh cửa chắn ngang hành lang, có ổ khoá phát sáng; trả lời đúng thì cửa mở
  ra rồi mới cho đi qua. Sau luật mới (hết 3 lượt cửa vẫn khoá) thì hình ảnh **cánh cửa
  vẫn đóng khi quay lưng đi** chính là phản hồi trực quan mà bản 2D đang thiếu.
- Ô "?" → cái rương đặt giữa hành lang, mở nắp khi trả lời đúng.

Đây là hạng mục **rẻ nhất và lợi nhất** trong sáu hạng mục.

### F. Hai tay và vũ khí tiền cảnh — **làm được**

Lớp vẽ tiền cảnh, vẽ sau cùng, nhún theo quãng đường đã đi. Cửa hàng đã bán kiếm gỗ / kiếm
sắt / đèn pin và `chiSo(vi.daMua)` đã tính ra chỉ số — nên **vũ khí trên tay phản ánh đúng
món đã mua** là chuyện đọc sẵn dữ liệu, không cần cơ chế mới. Hoạt ảnh chém đã có sẵn điểm
móc: `run.chem()` trả `{trung, haGuc}` và có hồi chiêu 0,35 s.

---

## 4. Hạ tầng: cái gì sống, cái gì sửa, cái gì viết mới

| Phần | Số phận |
|---|---|
| `systems/maze.js` (sinh mê cung, `solve`, `bfs`, `isWall`) | **Nguyên vẹn.** Là nguồn dữ liệu lý tưởng cho raycaster |
| `data/**` (câu hỏi, độ khó, cửa hàng, thưởng) | **Nguyên vẹn** |
| `systems/quiz.js` (hộp Leitner) | **Nguyên vẹn** |
| `systems/progress.js` (ví, mã lưu `BPL2`) | **Nguyên vẹn** nếu chọn A1/A2 |
| `core/**` (vòng lặp, input, âm thanh, rng) | **Nguyên vẹn** |
| `ui/mecung-ui.js` (bố cục nút) | **Nguyên vẹn** |
| Màn câu hỏi / cửa hàng / tạm dừng / thắng | **Nguyên vẹn** — đều là lớp phủ toàn màn hình |
| `systems/maze-run.js` | **Thêm** trường `yaw`. A1 không đụng gì khác; A2 phải viết va chạm hình tròn |
| `render/maze.js` → `drawMaze` (nhìn từ trên xuống) | **Đổi vai**: thu nhỏ thành **bản đồ góc màn hình**. Không vứt — bé rất cần nó |
| `render/maze3d.js` | **MỚI**: DDA raycaster, dựng cột tường, sàn/trần, ảnh dán, vạch chỉ đường |
| `render/textures.js` | **MỚI**: sinh vân bằng mã vào canvas ẩn, một lần lúc khởi động |
| `render/viewmodel.js` | **MỚI**: hai tay + vũ khí + nhún bước |

### Test — con số thật

- Tổng đang có: **400 test xanh**.
- `tests/maze-run.test.js` (36 test) bám chặt mô hình đi từng ô → **A1 không vỡ test nào**,
  A2 vỡ khoảng 15, A3 vỡ nhiều hơn và kéo theo cả `luu-van.test.js`.
- `tests/maze-render.test.js` dùng `mockCtx` đếm lệnh vẽ. Raycaster chủ yếu gọi `drawImage`
  nên phải viết bộ canh mới: đếm số cột dựng, canh không vẽ ra ngoài khung, canh `save`/
  `restore` cân bằng, canh `globalAlpha` không rò.
- `tools/hud-check.mjs` vẫn dùng được nguyên vì HUD không đổi.

---

## 5. Rủi ro thật — xếp theo mức nguy hiểm

### 5.1 HIỆU NĂNG — rủi ro số một, và có bằng chứng lịch sử

Nhật ký commit của chính dự án đã ghi hai lần phải hạ chất lượng vì lag:

```
e1a0d2f Giảm lag: hạ RS 1.5→1.25 + thêm đồng hồ FPS (phím `)
8adb303 Giảm lag 2 người song song: iframe song song dùng RS 0.9
```

Nghĩa là **máy đích không khoẻ**, và đây không phải suy đoán.

Tính thử với khung hiện tại 900×640 logic × RS 1.5 = **1350×960 điểm ảnh thật**:

| Việc | Chi phí mỗi khung | Kết luận |
|---|---|---|
| Bắn 1350 tia DDA | ~1350 vòng lặp ngắn | Rẻ, không đáng lo |
| Dựng 1350 cột tường bằng `drawImage` | 1350 lệnh vẽ → ~81 000 lệnh/giây ở 60fps | **Sát ngưỡng**. Dựng ở nửa độ phân giải (675 cột) rồi phóng to → an toàn |
| Vẽ sàn/trần **từng điểm ảnh** | ~675 000 điểm/khung → 40 triệu điểm/giây | **KHÔNG khả thi.** Phải dùng dải màu chuyển sắc, hoặc nửa độ phân giải |
| Ảnh dán (quái, hộp, vật phẩm) | Nhiều nhất 5 quái + vài ô | Rẻ |

#### Số đo THẬT (2026-08-03, `npm run bench:3d`)

Bản mẫu đã dựng xong và đo được. Chạy ở bề rộng cột 2 điểm ảnh logic → **450 tia/khung**
(không phải 1350 như ước tính ở trên — dựng ở nửa độ phân giải là đủ).

| Mức | Thuật toán | Lệnh vẽ khung nhìn 3D | Lệnh vẽ bản đồ nhỏ | Tổng | Bản 2D đang chạy |
|---|---|---|---|---|---|
| 🧸 Dễ | 0,06 ms (0,4%) | 510 | **1372** | 1882 | 1365 |
| ⚔️ Vừa | 0,06 ms (0,4%) | 539 | **780** | 1319 | 773 |
| 💀 Khó | 0,11 ms (0,6%) | 902 | 349 | 1251 | 342 |

**Ba điều rút ra, hai trong số đó lật ngược ước tính ban đầu:**

1. **Phép bắn tia gần như miễn phí** — dưới 1% ngân sách một khung ở 60fps. Mọi lo lắng về
   chi phí thuật toán là thừa. Nút thắt nằm hoàn toàn ở số lệnh vẽ.
2. **Chỗ đắt nhất KHÔNG phải khung nhìn 3D mà là BẢN ĐỒ NHỎ** — ở mức Dễ nó tốn 1372 lệnh
   vẽ, gấp 2,7 lần cả bộ raycaster. Lý do: `veBanDoNho` gọi lại nguyên hàm vẽ 2D, mà mức Dễ
   có `sight = 99` nên toàn bộ 225 ô đều được vẽ lại mỗi khung.
   ➜ **Việc tối ưu đầu tiên của giai đoạn 1 là bản đồ, không phải raycaster.** Tường mê cung
   không bao giờ đổi trong một ván; vẽ một lần vào canvas ẩn rồi dán lại sẽ hạ 1372 xuống
   còn một lệnh `drawImage` cộng vài chục lệnh cho nhân vật/quái/sương.
3. **Đỉnh của góc nhìn nhập vai là ×1,38 so với bản đang chạy** (1882 so với 1365). Mốc so
   sánh đúng không phải "bao nhiêu là nhiều" mà là "có hơn cái máy này đang chạy được
   hằng ngày không" — và 1,38 lần là khoảng cách đóng lại được chỉ bằng việc lưu đệm bản đồ.

Còn lại một ẩn số **không đo được ngoài trình duyệt**: chi phí thật của mỗi lệnh `drawImage`
trên máy đích. Phím `` ` `` trong game trả lời câu đó.

#### ĐO TRÊN MÁY THẬT (2026-08-03) — lật ngược toàn bộ phần cảnh báo ở trên

Bản mẫu đã chạy trên máy đích. Kết quả: **dưới 10% ngân sách một khung** ở mức 💀 Khó, màn
hình 100Hz (tức khoảng 1 ms trên 10 ms). Còn thừa khoảng **mười lần**.

Nghĩa là **ba biện pháp phòng thân bên dưới KHÔNG cần dùng đến**: không phải hạ độ phân giải,
không phải lưu đệm bản đồ nhỏ, không phải tắt 3D ở màn hình chia đôi. Giai đoạn 2 nhét vừa
thoải mái — đã thêm quái, cửa, rương, xu, cửa ra mà số đo gần như không nhúc nhích (trung
bình chỉ 34 cột ảnh dán mỗi khung so với 450 cột tường).

Bài học: phần "máy đích không khoẻ" ở trên suy ra từ LỊCH SỬ COMMIT chứ không phải từ phép
đo. Suy đoán đó sai. Ba biện pháp dưới đây giữ lại làm đường lùi nếu có ngày chạy trên máy
khác, không phải việc phải làm.

**Ba biện pháp phòng thân (chỉ dùng khi đo thấy cần):**
1. Chế độ 3D mặc định `RS = 1.0`, dựng thế giới ở 0,5–0,75 độ phân giải rồi phóng lên.
2. Sàn và trần dùng dải màu chuyển sắc ở giai đoạn 1, không vẽ từng điểm ảnh.
3. **Thêm đồng hồ FPS vào `src/mecung.js` TRƯỚC khi viết dòng raycaster đầu tiên.**
   Kiểm tra rồi: đồng hồ FPS hiện chỉ tồn tại trong `legacy/game-be-phieu-luu-v32.html`,
   **`src/` chưa có**. Không đo được thì không biết mình đang làm hỏng cái gì.

**Màn hình chia đôi hai người là trường hợp xấu nhất** — hai bộ raycaster chạy song song
trong hai iframe. Nhiều khả năng phải **tắt hẳn chế độ 3D khi chơi hai người**, hoặc chạy ở
1/4 độ phân giải. Cần đo trước khi hứa.

### 5.2 Trẻ 6 tuổi điều khiển được không

Đây là rủi ro thiết kế, không phải rủi ro kỹ thuật, và nó lớn hơn vẻ ngoài. Điều hướng nhập
vai khó hơn hẳn nhìn từ trên xuống: mất bản đồ tổng thể, dễ đi vòng, dễ mất phương hướng.
Bắt buộc phải giữ: bản đồ nhỏ góc màn hình · vạch chỉ đường trên tường · bấm để tự đi.

### 5.3 Say tàu xe

Nhún đầu và góc nhìn hẹp gây chóng mặt cho trẻ. Mặc định: nhún nhẹ, có nút tắt trong cài đặt,
góc nhìn không dưới 75°, không lắc camera khi trúng đòn (chỉ chớp viền màu).

### 5.4 Kích thước bản dựng

Vân sinh bằng mã → không có tệp ảnh → **ràng buộc một tệp .html vẫn giữ được**.
Ước tính tăng thêm 40–60 kB mã nguồn. `dist/mecung.html` hiện 92 kB, sau vẫn dưới 160 kB.

---

## 6. Lộ trình đề xuất — ba giai đoạn, mỗi giai đoạn chơi được ngay

**Giai đoạn 1 — "Camera nhập vai, luật cũ nguyên vẹn"** (~500–700 dòng)
Đồng hồ FPS → raycaster → tường có vân theo 3 bộ đồ hoạ đang có → sàn/trần chuyển sắc →
sương theo `sight` → bản đồ nhỏ góc màn hình → cửa và rương → vạch chỉ đường trên tường.
Di chuyển **giữ nguyên mô hình ô** (A1). ➜ **0 test vỡ, 0 thay đổi logic.**
Đây là giai đoạn trả lời câu hỏi hiệu năng — nếu tụt khung hình ở đây thì dừng, chưa mất gì.

**Giai đoạn 2 — "Sống động"** (~400–600 dòng) — ĐANG LÀM
- ✅ Ảnh dán có bộ đệm độ sâu (quái đứng sau tường không hiện ra), xếp xa-trước-gần-sau
- ✅ Quái · cửa câu hỏi · rương thưởng · xu lơ lửng · cửa ra (đỏ/xanh theo số chìa)
- ✅ Nhìn tự do bằng kéo chuột · điều khiển theo mắt (tiến / quay trái / quay phải / quay lại)
- ⬜ Hai tay + vũ khí tiền cảnh theo món đã mua trong cửa hàng
- ⬜ Cảnh báo khi quái vào gần (phải báo TRƯỚC khi nhìn thấy — CLAUDE.md §7)
- ⬜ Vạch chỉ đường trên tường (dữ liệu đã có sẵn: `run.hint()` + `MAZE_DIFF.compass`)
- ⬜ Đèn pin thành nón sáng thật · nhún bước · chớp viền khi trúng đòn

**Giai đoạn 3 (tuỳ chọn) — "Đi tự do"** (~200 dòng + viết lại ~15 test)
Vị trí và góc liên tục, va chạm hình tròn trượt tường, trợ lái tự canh giữa hành lang (A2).
Đặt sau một nút cài đặt, **mặc định TẮT** cho bé.

---

## 7. Kết luận

| Hạng mục | Mức làm được |
|---|---|
| A. Góc nhìn nhập vai | **95%** — vướng ở mô hình di chuyển, không vướng ở đồ hoạ |
| B. Vạch chỉ đường trên tường | **100%** — dữ liệu đã có sẵn, còn hợp hơn cái la bàn hiện tại |
| C. Cảnh báo quái tới gần | **100%** |
| D. Đồ hoạ như game 3D | **70%** — chất DOOM 1993, không phải Half-Life 2004; chặn bởi luật cấm tệp ảnh |
| E. Câu hỏi thành cửa và hộp | **100%** — rẻ nhất, lợi nhất |
| F. Hai tay và vũ khí | **100%** |

**Làm được, và làm được bằng đúng ràng buộc dự án đang có** — không thêm thư viện, không
thêm tệp ảnh, vẫn gói được vào một tệp .html. Toàn bộ phần khó nhất của một game như thế
này (sinh mê cung, tìm đường, kho câu hỏi, hộp Leitner, lưu tiến trình, cân bằng) **đã xong
và không phải đụng vào**. Việc còn lại thuần tuý là một lớp vẽ mới.

Hai chỗ duy nhất cần dè chừng, và cả hai đều **đo được trước khi cam kết**:
hiệu năng trên máy đích, và việc bé 6 tuổi có tự đi nổi trong góc nhìn nhập vai hay không.
