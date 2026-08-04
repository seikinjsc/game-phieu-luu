# Nhật ký thay đổi

Mọi thay đổi đáng kể của dự án được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
dự án tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

## [Chưa phát hành]

### Added

- **Mê cung — GÓC NHÌN NHẬP VAI** (`src/render/maze3d.js`, xem `docs/ME-CUNG-3D.md`).
  Dựng bằng **raycasting kiểu Wolfenstein 3D trên Canvas 2D** — không thư viện, không tệp
  ảnh, vẫn gói được vào một tệp .html. Chọn raycasting vì mê cung đã là lưới vuông góc một
  tầng, và bộ dựng hình chỉ cần đúng một phép hỏi `maze.isWall(x, y)` mà `systems/maze.js`
  xuất sẵn. Cấu trúc dữ liệu đang có *đã là* cấu trúc lý tưởng.
  - **Hai góc nhìn sống song song**, chọn ở màn chọn hoặc màn tạm dừng, lưu trong ví
    (`vi.gocNhin`). Bản nhìn từ trên xuống KHÔNG bị thay thế: nó là đường lùi cho máy yếu,
    cho màn hình chia đôi hai người, và cho bé chưa quen. Phím tắt `V`.
  - **Phương án A1** — giữ nguyên đi từng tâm ô sang tâm ô, `maze-run.js` không sửa một dòng
    nào. Đi tự do kiểu Half-Life sẽ mang lỗi "kẹt góc" ghi ở đầu `maze-run.js` quay lại.
  - Vân tường **sinh bằng mã** lúc khởi động; sương mờ theo `sight` của mức khó; bản đồ nhỏ
    ở góc dùng lại nguyên hàm vẽ 2D.
  - **Vật thể trên đường đi**: quái · cửa câu hỏi (cánh gỗ có dấu ?) · rương thưởng · xu lơ
    lửng · cửa ra (đỏ khi thiếu chìa, xanh khi đủ). Có **bộ đệm độ sâu** nên quái đứng sau
    tường không hiện ra, và xếp xa-trước-gần-sau nên chiều sâu không lộn ngược.
  - **Điều khiển theo mắt, không theo bản đồ**: ↑ tiến · ← → quay 90° · ↓ quay lại. Bốn vùng
    bấm chuột làm y hệt. Trái/phải là lệnh QUAY chứ không phải đi ngang — nhân vật chỉ có một
    hướng, nên "bước sang trái" sẽ thành lượn vòng tròn tại chỗ.
  - **Giữ chuột trái kéo để nhìn quanh**. Kéo theo kiểu nắm lấy cảnh (kéo phải → nhìn quay
    trái) vì con trỏ không bị khoá. Nhả chuột sau khi kéo không bị tính là lệnh đi.
  - `npm run bench:3d` — đo chi phí dựng hình không cần trình duyệt. Thêm **đồng hồ FPS**
    vào `src/mecung.js` (phím `` ` ``), hiện cả thời gian thật đã tiêu trên ngân sách khung:
    `fps` bị chặn theo tần số quét màn hình nên không nói được còn thừa bao nhiêu.
  - **Đo trên máy thật: dưới 10% ngân sách khung** ở mức Khó. Mọi cảnh báo "máy đích không
    khoẻ" trong bản phân tích đều suy ra từ lịch sử commit chứ không từ phép đo, và suy đoán
    đó sai.

### Changed

- **Mê cung — bấm chuột đi TỪNG Ô** thay vì tự đi hết đường tới đích. Người chơi giữ quyền
  quyết định ở mọi ô. (Đã thử bản trung gian "đi tới ngã rẽ kế tiếp" rồi bỏ.)

### Added

- **Kho tri thức mở rộng gấp gần ba lần** — hệ quả trực tiếp của luật "sai mất tim, hết lượt
  thì cửa vẫn khoá": bé quay lại cửa nhiều hơn hẳn, kho mỏng là lộ ngay. Cửa sổ chống lặp
  của hộp Leitner rộng bằng **nửa số câu trong nhóm**, nên độ sâu của từng nhóm mới là thứ
  quyết định có lặp câu hay không.
  - **Toán: 17 → 46 khuôn**, mỗi lớp ≥ 8 (trước đây lớp 3–5 chỉ có 3 khuôn, cửa sổ chống
    lặp rộng đúng 1). Bám Chương trình GDPT 2018:
    - *Lớp 1* thêm số liền trước/liền sau · tìm số còn thiếu · xem đồng hồ giờ đúng · cấu tạo chục–đơn vị.
    - *Lớp 2* thêm cộng trong 1000 · đổi dm/cm/m/km · xem giờ rưỡi · tiền Việt Nam · toán có lời văn (chỉ bảng 2 và 5).
    - *Lớp 3* thêm bảng nhân 6–9 · chia có dư · gấp lên/giảm đi · tìm x · hình vuông · đổi g/ml/mm.
    - *Lớp 4* thêm nhân số có hai chữ số · dấu hiệu chia hết · rút gọn phân số · so sánh phân số ·
      trừ phân số · tìm phân số của một số · tổng–hiệu.
    - *Lớp 5* thêm cộng/trừ và chia số thập phân · diện tích tam giác, hình thang, hình tròn ·
      thể tích hình hộp · tìm một số biết giá trị phần trăm.
    - Mọi khuôn mới đều khai báo **mồi nhử là lỗi sai thật** (quên chia 2, quên viết lùi cột,
      đọc giờ theo kim dài, "giảm đi 3 lần" hiểu thành "bớt 3"…) và `why` nói trúng chỗ sai đó.
    - Số thập phân tính trên số NGUYÊN phần mười rồi mới đổi ra chữ — làm thẳng trên số thực
      thì `12.5 − 3.4` ra `9.099999999999998` và đáp án hiện ra sai bét.
  - **Trạng Nguyên nhí: 44 → 110 câu**, thêm ba nhóm mới 🍎 Trái cây (16) · 🏠 Đồ vật trong
    nhà (14) · 🌈 Thiên nhiên (14); nhóm cũ dày lên: con vật 24→32, đố chữ 13→20, đồ dùng 7→14.
    Mỗi nhóm **đồng nhất một loại đáp án** — đó là điều kiện để mồi nhử tự sinh (`tuSinhMoiNhu`)
    còn đúng luật, nhóm lẫn "Con mèo" với "Cái bàn" thì bé loại trừ bằng hình thức.
  - **Olympia: 61 → 119 câu**, mọi nhóm ≥ 15: khoa học 18→26 · địa lý 11→20 · lịch sử 8→20 ·
    văn học 8→18 · toán đố 7→15 · đời sống 9→20. Mồi nhử **viết tay từng câu** theo đúng luật
    cứng của bộ này.
  - Thêm phép canh dữ liệu: không trùng đáp án trong Trạng Nguyên (bảng tra nhóm lập theo đáp
    án, trùng là bảng sai và phép canh "mồi nhử cùng nhóm" mù luôn) · không trùng đề bài ·
    không trùng đáp án trong cùng nhóm Olympia · sàn số câu mỗi nhóm nâng lên.

### Changed

- **Mê cung — câu hỏi nay có giá.** Đổi luật cũ "sai vẫn mở cửa" theo yêu cầu người chơi:
  - **Sai một đáp án = mất một tim.** Cố ý KHÔNG dùng khoảng bất tử 1,5 giây của đòn quái —
    bất tử là để chống bị vây, còn đây là hình phạt của câu hỏi; dính bất tử thì bấm bừa ba
    lần trong 1,5 giây coi như không mất gì.
  - **Vẫn tối đa 3 lượt mỗi câu.** Hết 3 lượt: hiện lời giải, và **cửa khoá VẪN KHOÁ** —
    phải quay lại trả lời tiếp mới lấy được chìa. Nút thoát đổi nhãn thành
    "Quay lại thử sau ▶" để không ai tưởng game hỏng.
  - **Ô "?" thưởng thì luôn coi như dùng xong** dù sai hay đúng (nếu để nguyên thì đứng đó
    bấm lại vô hạn để đổi lấy câu dễ). Nhưng sai ở ô thưởng **cũng mất tim** — nó là canh
    bạc, không còn là quà miễn phí.
  - **Không hề có bế tắc.** Hết tim → về cửa đã mở gần nhất với **đầy tim**, giữ nguyên
    chìa/xu/thời gian (luật §2 không đổi). Quay lại cửa cũ là được hỏi **câu khác**.
  - **Câu hỏi ra ngẫu nhiên theo LƯỢT CHƠI**, không còn gieo theo mã mê cung. Trước đây
    `makeRng(seed * 7919)` nên chơi lại cùng mê cung là gặp đúng chuỗi câu cũ ở đúng những
    cửa cũ — bé học thuộc vị trí đáp án chứ không học kiến thức, mà nay sai còn mất tim nên
    học vẹt càng có lợi. Bố cục mê cung/cửa/xu **vẫn gieo theo `seed`**, không đổi.
  - Màn câu hỏi **vẽ lại dãy tim** ở góc trái: màn này phủ kín HUD, không thấy tim vơi đi thì
    hình phạt trở nên vô hình.

### Added

- **Mê cung — quái vật, chiến đấu, tim, cửa hàng vũ khí** (đợt 2).
  - `src/systems/mobs.js` (mới) — quái tuần tra, đi cùng mô hình tâm-ô-sang-tâm-ô như nhân vật
    nên không bao giờ kẹt góc hay lọt tường. **Ưu tiên đi thẳng, chỉ rẽ ~25% ở ngã ba**: quái
    rẽ ngẫu nhiên mỗi ô thì trẻ không đoán nổi, va vào chỉ là xui — và trẻ học được rằng cố
    gắng cũng vô ích. Đặt cách xa điểm xuất phát ≥6 ô để bé có thời gian làm quen.
  - **Tim ❤️** theo mức (Dễ 5 · Vừa 4 · Khó 3). Chạm quái mất 1 tim + **bất tử 1,5 giây**
    (không có khoảng này thì đứng cạnh quái là mất sạch tim trong chưa tới một giây).
    **HẾT TIM KHÔNG PHẢI LÀ THUA**: về cửa khoá đã mở gần nhất, **giữ nguyên chìa, xu, thời
    gian**, hồi đầy tim. Luật §2 vẫn nguyên vẹn — không bao giờ mất tiến trình.
  - **Chém** bằng PHÍM CÁCH / J / K / F, hoặc **bấm chuột vào quái** đang trong tầm. Có hồi
    chiêu 0,35s để "giữ nút" không thành chiến thuật. Hạ gục được **8 xu / 60 điểm**.
  - `src/data/shop.js` (mới) + màn **🛒 Cửa hàng**: kiếm gỗ 60 · kiếm sắt 160 · áo giáp 120 ·
    giày nhanh 100 · đèn pin 90. Món cùng loại lấy giá trị **tốt nhất, không cộng dồn**.
    **Không món nào can thiệp vào câu hỏi** — kiến thức không mua bằng xu được (có test canh).
  - Mức Dễ nay có **1 quái đi chậm** thay vì 0 như bản thiết kế §3: 0 con thì bé chơi mức Dễ
    không bao giờ biết trong game có quái, mất hẳn một nửa cách chơi.
- **Mê cung — đồng hồ, xu/điểm, âm thanh, ô ❓ thưởng** (đợt 1 của yêu cầu lớn; đợt 2 là
  quái vật + chiến đấu + cửa hàng vũ khí).
  - **Đồng hồ đếm ngược** theo mức (Dễ không giới hạn · Vừa 300s · Khó 420s). Chuyển vàng
    khi còn dưới 1 phút, đỏ khi hết. **HẾT GIỜ KHÔNG PHẢI LÀ THUA** — chỉ mất thưởng tốc độ,
    vẫn đi tiếp và vẫn về đích được (luật §2: không bao giờ mất tiến trình).
  - `src/data/rewards.js` (mới) — bảng thưởng dữ liệu thuần. Đúng ngay lần đầu **10 xu/100 điểm**,
    mò ra sau khi sai chỉ 4/40 — chênh lệch phải lớn, nếu không bé sẽ bấm bừa cho nhanh.
    Sai hết được 0 và **không bao giờ bị trừ**: sợ sai thì không dám thử.
  - `src/systems/progress.js` (mới) — ví xu + điểm + kỷ lục, lưu qua `localStorage` (khoá riêng
    `mecung1`, **không đụng mã BPL** của game 60 cửa). Kho lưu tiêm vào được nên test chạy ở node.
    Ví không bao giờ âm; kho hỏng hoặc bị chặn thì vẫn chơi được, chỉ mất phần lưu.
  - **Ô ❓ thưởng** — câu hỏi **khó hơn một lớp**, không bắt buộc, sai không bị phạt giây,
    đúng được 30 xu/300 điểm. Ưu tiên đặt ở ngõ cụt xa nhất; mê cung nhỏ không còn ngõ cụt thì
    bù bằng lấy mẫu điểm xa nhất — nếu không, cả tính năng biến mất tuỳ hạt giống.
  - **Xu rơi** nay có danh sách riêng (`maze.coins`): ngõ cụt còn lại **cộng thêm** xu rải dọc
    hành lang. Chỉ đặt ở ngõ cụt là không đủ — có hạt giống không còn ngõ cụt nào.
  - **Âm thanh** dùng lại `core/audio.js` sẵn có: nhạc nền chỉ kêu khi đang đi trong mê cung
    (nghe nhạc lúc đọc đề rất khó tập trung), tiếng nhặt xu, mở cửa, trả lời sai, hết giờ,
    thắng ván, và tiếng "tách" xác nhận bấm nút. **Hai nút 🎵 / 🔊 bật tắt riêng**, đặt ngay
    trên màn hình chứ không giấu trong menu con.

### Added

- **TẠM DỪNG và LƯU ĐỂ CHƠI LẦN SAU** — bám đúng thiết kế màn tạm dừng của game Phiêu Lưu
  (▶ Tiếp tục · 🔄 Chơi lại mê cung này · 💾 Lưu & ra màn chọn · 🚪 Thoát không lưu).
  - **ESC / P** bật tắt tạm dừng, hoặc nút ☰ trên thanh. Màn tạm dừng vẽ ĐÈ lên mê cung đang
    mờ, không xoá hẳn — nhìn thấy mình đang ở đâu thì mới nhớ đang chơi dở cái gì.
  - **Lưu ngay lúc dừng**, không đợi bấm nút "Lưu"; nút ☰ cũng lưu trước khi ra; và có
    `beforeunload` cho trường hợp đóng tab giữa chừng — trẻ con hay tắt máy đột ngột.
    Chỉ nút "🚪 Thoát, không lưu" mới xoá bản lưu, và nó nằm xa nút Tiếp tục nhất, màu xám.
  - `maze-run.trangThai()` / `opts.nap` — **chỉ lưu thứ không suy ra được từ hạt giống**.
    Mê cung, vị trí cửa, vị trí xu đều dựng lại từ `seed` nên bản lưu gọn (dưới 6 KB).
  - **Hộp Leitner cũng được lưu**: đó là toàn bộ việc học tích luỹ được. Không lưu thì mỗi
    buổi bé lại ôn từ con số không, hỏng hẳn ý nghĩa của cách chọn câu.
  - Màn chọn: có ván dở thì **▶ CHƠI TIẾP là nút chính**, "Ván mới" lùi xuống nút phụ — mở
    game lên mà nút to nhất là "bắt đầu lại" thì rất dễ bấm nhầm, mất sạch ván đang dở.
  - Test bắt được một lỗi thật: bản lưu hỏng với toạ độ ngoài lưới đặt nhân vật **kẹt trong
    tường**. Nay kiểm ô có hợp lệ không, không chỉ kiểm "là số"; hỏng thì chơi lại từ đầu.
- **HẠ TẦNG BỘ ĐỀ — chọn nguồn câu hỏi, không chỉ chọn lớp.** Màn chọn nay có hàng
  **② CÂU HỎI lấy từ đâu?** với ba bộ, mỗi bộ có thang cấp độ riêng:
  | Bộ đề | Cấp độ | Nguồn |
  |---|---|---|
  | 🔢 Toán | Lớp 1–5 | Sinh bằng khuôn mẫu, bám Chương trình GDPT 2018 |
  | 👑 Trạng Nguyên nhí | Đố con vật · Đố chữ · Đồ dùng · Trộn tất cả | 44 câu đố, chép từ vndoc |
  | 🏆 Olympia | Tất cả các môn | 91 câu, bóc tự động từ tài liệu người dùng |
  - `src/data/banks.js` (mới) — **sổ đăng ký**. Mọi bộ đề chỉ cần ba thứ: `capDo` · `ids(cap)`
    · `sinh(id)`. Thêm môn mới = thêm MỘT mục, không sửa game/giao diện/hộp Leitner.
  - `src/data/questions/bank.js` (mới) — hạ tầng biến **tự luận thành trắc nghiệm**. Mọi tài
    liệu thật đều ở dạng "câu hỏi → đáp án", còn màn hình chỉ có 4 nút. Giải bằng cách lấy
    **mồi nhử từ đáp án của các câu khác** trong cùng bộ. Hai điều kiện CỨNG: **cùng nhóm**
    (đố con vật thì mồi nhử phải là con vật) và **cùng kiểu** (số đi với số). Không đủ 3 mồi
    nhử thoả thì mới nới ra — xếp hạng rồi cắt ngọn là không đủ, có test canh cả hai.
  - `tools/import-olympia.mjs` (mới) — bộ chuyển đổi tài liệu `.docx` → dữ liệu game.
    Lấy 91/104 câu, **ghi rõ ra màn hình 13 câu bị bỏ và lý do** (đáp án quá dài, đề 1912 ký
    tự, không tách được đáp án). Bổ sung tài liệu mới chỉ cần chạy lại lệnh.
  - `src/data/questions/trang-nguyen.js`, `olympia.js` (mới) — dữ liệu.
- **Chỉnh âm lượng, và mặc định TO HƠN.** `core/audio.js` thêm `musicVol` / `sfxVol` là hệ số
  nhân, trần kẹp nâng 0.3 → 0.6. **Mặc định vẫn là 1 nên game 60 cửa không đổi một chút nào**
  (có test canh riêng); trang mê cung tự đặt hệ số cao hơn lúc khởi động.
  Bốn mức **Tắt · Nhỏ · Vừa · To**, bấm nút là xoay vòng, **lưu lại** nên mở lần sau không
  phải chỉnh lại. Nhạc nền mặc định thấp hơn hiệu ứng một bậc — nhạc to ngang tiếng nhặt xu
  thì át mất phản hồi của thao tác. Ở màn chọn nút hiện kèm tên mức, trên thanh trong mê cung
  chỉ hiện biểu tượng 🔇/🔈/🔉/🔊 cho gọn.

### Changed

- **Mê cung: khung chơi toàn màn hình, thông tin thành lớp phủ.** Canvas trang mê cung đổi
  900×500 → **900×640** (mê cung là hình vuông, khung dẹt là phí chỗ). Mê cung **568×568**
  thay vì 480×480 — rộng hơn 40% diện tích — canh giữa, và trang lấp đầy cửa sổ trình duyệt
  nên màn hình to thì mê cung to theo. Bảng thông tin bên phải (ăn 390 điểm ảnh bề ngang chỉ
  để hiện mấy con số) thay bằng **thanh chip phủ trên đỉnh** + nút ☰ ⛶ 🎵 🔊. Thêm nút
  **toàn màn hình**. Bố cục màn chọn gom hết toạ độ vào một bảng `MENU_Y`.

### Fixed

- **NGÂN HÀNG CÂU HỎI: mồi nhử do máy bịa → làm lại bằng tay.** Bản trước lấy 91 câu Olympia
  thẳng từ tài liệu rồi để máy sinh mồi nhử bằng cách bốc đáp án của câu khác. Với kho kiến
  thức tổng hợp thì cách đó **sai về nguyên tắc**:
  `"Hợp chất nào của nitơ dùng làm chất gây lạnh?" → Đức · tâm · NH3 · xiếc`
  — chỉ NH3 là công thức hoá học nên bé khoanh trúng mà không cần biết gì.
  - **Khảo sát thấy 38/91 câu hỏng**: 9 câu "A hay B?" (đáp án nằm ngay trong đề), 6 câu có
    sẵn "a. b. c. d." trong đề, 6 câu điền chỗ trống, 2 câu liệt kê lựa chọn trong đề, còn
    lại quá chuyên sâu hoặc đề dài lê thê.
  - **Viết lại `olympia.js` bằng tay: 51 câu, mỗi câu 3 mồi nhử người viết**, chia 6 nhóm
    (KHTN · Địa lý · Lịch sử · Văn học · Toán đố · Đời sống) để chọn cấp độ theo môn.
  - **`taoBoDe` nay NÉM LỖI ngay lúc nạp mô-đun** nếu câu nào thiếu `sai`. Muốn máy sinh mồi
    nhử phải bật cờ `tuSinhMoiNhu: true` — chỉ Trạng Nguyên dùng, vì ở đó mỗi nhóm toàn một
    loại đáp án nên bốc chéo cho kết quả tốt thật.
  - Chữ đáp án dài **tự co cho vừa nút**, không còn đè lên ô số thứ tự.
  - Test mới canh đúng ba lỗi đã thấy: đáp án không được nằm trong đề · không bê a./b./c. vào
    đề · không phải dạng điền chỗ trống. Cộng thêm canh mọi câu đủ 3 mồi nhử không trùng nhau.
- **CÂU HỎI DÀI TRÀN RA NGOÀI MÀN HÌNH** (người dùng chụp màn hình báo). Câu đố Trạng Nguyên
  78 ký tự vẽ thành MỘT dòng, mất cả chữ đầu lẫn chữ cuối. Chỉ co cỡ chữ là không đủ — thêm
  `ngatDong()` cắt theo **bề ngang đo thật** bằng `measureText`, không theo số ký tự
  ("iii" và "MMM" cùng 3 ký tự nhưng rộng khác nhau gấp ba). Áp cho cả đề bài lẫn lời giải.
  Ô chip trên thanh thông tin cũng đo thật thay vì nhân số ký tự với một hằng số bịa ra.
  Test mới: dựng 4 câu dài ngắn khác nhau, tính mép trái/phải từng dòng, **không dòng nào
  được vượt mép canvas**. Ctx giả nay có `measureText` đọc cỡ chữ từ `ctx.font`.
- **Chữ trên màn chọn đè lên nút ▶** (người dùng chụp màn hình báo). Không phải sai toạ độ:
  `drawButton` kết thúc bằng `textAlign = 'left'`, tức là **làm bẩn trạng thái của người gọi**
  — mọi dòng chữ vẽ SAU nút đều bị canh trái, chạy từ giữa màn hình sang phải và đè lên nút.
  Nay `drawButton` bọc trong `save`/`restore`. Test cũ chỉ canh nút-với-nút nên không thấy;
  đã thêm test canh **trạng thái ctx không bị làm bẩn** và **mọi dòng chữ màn chọn phải canh giữa**.
- **Toàn bộ trục dọc lệch 106 điểm ảnh.** `px()` được dùng cho cả hai trục; trước đây
  `VIEW.x === VIEW.y === 10` nên trùng nhau, vừa canh giữa mê cung là lộ ra — quái, xu, cửa
  khoá, nhân vật đều trôi khỏi ô của nó. Tách thành `px()` trục ngang và `py()` trục dọc.

- **Mê cung: điều khiển bằng CHUỘT.** Giao diện dựng lại theo lối game Phiêu Lưu — nút viên
  thuốc, chữ đậm 900, **bóng đổ khối `0 4px 0`**, bấm xuống thì lún 3px; bảng màu lấy đúng
  `--navy #22306E` / `--pink #E8447F` / `--gold #FFB300` của legacy.
  - `src/ui/mecung-ui.js` (mới) — **bố cục nút và bắt chuột, thuần, không vẽ**. Danh sách nút
    dùng CHUNG cho cả phần vẽ lẫn phần bắt chuột, nên chỗ vẽ và chỗ bấm không bao giờ lệch nhau.
  - Màn chọn: hai trục thành hai khối nút riêng (① mức mê cung · ② ◀ lớp ▶), nút đổi phiên bản,
    nút **BẮT ĐẦU** lớn. Màn thắng: 3 nút. Trong mê cung: nút ☰ về màn chọn.
  - 4 đáp án câu hỏi nay là **nút bấm được**, có ô số tròn vừa làm phím tắt vừa làm chỗ bấm.
  - **Bấm vào một ô trong mê cung → nhân vật tự đi tới đó** (dùng lại `solve()`). Chỉ nhận ô ĐÃ
    NHÌN THẤY và không phải tường — nếu không thì thành chỉ đường qua vùng bé chưa khám phá.
    Chạm bàn phím là huỷ tự đi, người chơi giành lại quyền lái ngay.
  - **Bàn phím giữ nguyên toàn bộ.** Nút vẽ trên canvas không có tiêu điểm bàn phím và trình đọc
    màn hình không thấy — đánh đổi đã biết của việc đóng gói một tệp, nên mọi nút đều có phím
    tắt tương đương.
- **La bàn: thay chấm tròn bằng MŨI TÊN đuôi đứt khúc** chạy từ nhân vật sang ô cần đi. Chấm
  tròn không nói lên hướng — nhìn vào không biết là "đi lối này" hay "có gì ở đây".

### Fixed

- **Mê cung: hiện rõ HAI TRỤC độ khó.** Người chơi chọn mức "Dễ" rồi gặp cộng có nhớ và
  phép chia, tưởng game ra đề quá sức. Nội dung thật ra ĐÚNG chuẩn — game mặc định lớp 2, mà
  chương trình lớp 2 có đúng những thứ đó. Lỗi nằm ở giao diện: thiết kế có hai trục tách rời
  (mê cung khó ≠ câu hỏi khó) nhưng màn hình chỉ khoe một trục, còn lớp thì lúc chơi không hiện
  ở đâu. Nay màn chọn tách thành **① MÊ CUNG** / **② CÂU HỎI**, HUD hiện `📘 Câu hỏi: Toán lớp N`
  suốt lúc chơi, màn câu hỏi cũng ghi lớp.
- **Vá nội dung mỏng ở lớp 1** (chỉ có 2 khuôn → hộp Leitner chỉ theo dõi được 2 kỹ năng, bé
  gặp lại cùng một dạng liên tục). Thêm 3 khuôn bám chương trình: `m1-nham` (nhẩm trong 10 —
  bậc dễ nhất của cả bộ), `m1-sosanh` (so sánh số, mồi nhử là **cặp đảo chữ số** 37/73),
  `m2-tru-nho` (trừ có nhớ, mồi nhử là **"trừ ngược cho khỏi mượn"** 61 − 28 → 47).
  Thêm test canh mỗi lớp phải có **≥ 3 khuôn**.

- **MÊ CUNG TRI THỨC — mốc M2: cửa khoá hỏi câu hỏi.** Vòng chơi đầy đủ với một môn
  (Toán lớp 1–5). Ở màn chọn bấm **L** đổi lớp, **B** đổi phiên bản, **1/2/3** chọn mức.
  - `maze-run.js`: cửa khoá không tự mở nữa mà **treo lại** (`pending`); mê cung và đồng hồ
    đứng im trong lúc trả lời; `resolve(dung, phatGiay)` đóng cửa. Thêm đếm `stars`
    (số cửa đúng ngay lần đầu).
  - `render/maze.js`: thêm `drawQuestion` — đề bài, 4 lựa chọn 2×2, đánh dấu đáp án đã chọn sai,
    sai 3 lần thì hiện **lời giải** (tự ngắt dòng) và lối thoát.
  - `mecung.js`: nối `quiz.js` + `math-gen.js`. **Hộp Leitner sống xuyên suốt nhiều mê cung** —
    tạo lại mỗi ván là mất sạch tiến trình ôn tập, hỏng toàn bộ ý nghĩa của nó. Chỉ tính
    "trả lời đúng" khi trúng **ngay lần đầu**. Sai một lần phạt 15 giây.
  - **LUẬT CỨNG được test canh:** trả lời sai **vẫn mở cửa**, chỉ mất sao và mất thời gian.
    Không có đường nào dẫn tới bế tắc. Trẻ kẹt 2 phút là bỏ game, mà bỏ game thì không học được gì.
  - Test điểm vào được viết lại cho **thật**: bản trước chỉ đếm `4000 === 4000` (không chứng minh
    gì cả). Bản mới dựng mê cung song song cùng hạt để biết đường đi, lái nhân vật bằng đúng phím
    mũi tên tới cửa, rồi **đọc màn hình qua `fillText`** để kiểm chứng câu hỏi hiện ra, chặn được
    di chuyển, và chìa vẫn được cấp khi trả lời sai.
- **MÊ CUNG TRI THỨC — mốc M1: mê cung chơi được** (`mecung.html`, trang RIÊNG, không đụng
  vào `index.html` / `multi.html`). Chưa có câu hỏi — cố ý: luật M1 là mê cung phải tự nó vui
  trước đã. Chạy bằng `npm run dev` rồi mở `/mecung.html`.
  - `src/systems/maze.js` — sinh mê cung từ hạt giống: quay lui theo chiều sâu → đục thêm
    ~10% tường tạo **vòng lặp** (mê cung hoàn hảo bắt trẻ đi vào ngõ cụt liên tục, rất chán)
    → đặt cửa ra + cửa khoá bằng **lấy mẫu điểm xa nhất** nên cửa rải đều, không dồn một góc.
    Kèm `bfs`/`solve` cho la bàn. Cùng hạt → mê cung y hệt.
  - `src/systems/maze-run.js` — trạng thái lượt chơi: đi giữa hành lang từ tâm ô sang tâm ô
    (không kẹt góc như va chạm hộp tự do), quay đầu được ngay giữa đường, sương mù theo mức khó,
    gom chìa, nhặt xu ở ngõ cụt, la bàn **bám một mục tiêu** tới khi mở được nó.
  - `src/render/maze.js` — vẽ toàn bằng lệnh Canvas, 3 bộ da (Xứ Khối Vuông · Học Viện Phù Chú ·
    Quần Đảo Kho Báu), sương mù 3 mức, HUD chìa/xu/thời gian.
  - `src/data/difficulty.js` — thêm `MAZE_DIFF`: trục độ khó MÊ CUNG tách rời trục kiến thức
    (15/21/31 ô · 3/5/7 cửa · tầm nhìn 99/7/4 ô · la bàn luôn/bấm/không).
  - Test: `maze` (17) · `maze-run` (18) · `maze-render` (10) · `mecung-entry` (2).
    **Bốn lỗi thật bị bắt trong lúc làm** — cột góc bị đục thủng thành sân; `cell` báo nhầm ô
    gốc nội suy thay vì ô đã chạm tâm; ngân sách thừa sau khi tới tâm ô bị tiêu bằng lệnh cũ
    khiến **không rẽ được ở ngã rẽ**; ctx giả trong test thiếu `translate` nên báo oan. Mỗi lỗi
    đều để lại một test canh riêng.
- **Nền tảng cho chế độ MÊ CUNG TRI THỨC — bộ sinh câu hỏi Toán + hộp Leitner.** Hai tệp đầu
  tiên của chế độ mê cung (thiết kế ở `ME-CUNG-DESIGN.md` / `ME-CUNG-NOI-DUNG.md` ngoài repo).
  Chưa nối vào game, chạy độc lập và có test riêng.
  - `src/data/questions/math-gen.js` — 14 khuôn sinh câu Toán lớp 1–5, mỗi khuôn bám đúng
    **miền số của Chương trình GDPT 2018** (lớp 1 cộng trừ *không nhớ* trong 100; lớp 2 nhớ
    ≤1 lượt, nhân chia *chỉ bảng 2 và 5*; lớp 3 nhân chia số 1 chữ số + chu vi/diện tích;
    lớp 4 phân số mẫu ≤12, đổi đơn vị, trung bình cộng; lớp 5 phần trăm, vận tốc, thập phân).
    Sinh từ hạt giống `core/rng.js` → **cùng hạt luôn ra cùng câu**, test được.
    **Mồi nhử là lỗi sai thật**, không phải số ngẫu nhiên: quên nhớ 1, cộng tử-cộng-mẫu,
    nhầm chu vi với diện tích, "nhân thì phải to hơn", dùng hệ số 10 cho đơn vị diện tích.
    Mọi câu bắt buộc có trường `why` (lời giải) — không có thì chỉ là đố vui, không dạy được.
  - `src/systems/quiz.js` — chọn câu bằng **hộp Leitner 3 ngăn** (sai → gặp lại sau 3 cửa;
    đúng 2 lần → giãn ra 30 cửa; bốc theo tỉ lệ 60/30/10). Áp nghiên cứu *retrieval practice
    + spacing*. Câu sinh tự động theo dõi theo **id khuôn** (kỹ năng), câu viết tay theo id
    riêng (đơn vị kiến thức). `state()` trả object thuần để nhét vào mã lưu BPL2 sau này.
    **Luôn bốc được câu kể cả kho 1 câu** — không bao giờ để người chơi kẹt trong mê cung.
  - `tests/math-gen.test.js` (34) + `tests/quiz.test.js` (11) — canh từng ràng buộc chương
    trình trên 300–400 mẫu mỗi khuôn. Vi phạm miền số là **lỗi im lặng**: game vẫn chạy, chỉ
    có bé là khổ, nên phải có test mới coi là xong.
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
