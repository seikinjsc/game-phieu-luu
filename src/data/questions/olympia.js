// data/questions/olympia.js — kiến thức tổng hợp, THCS trở lên.
//
// VIẾT TAY, KHÔNG SINH TỰ ĐỘNG NỮA. Bản trước lấy 91 câu thẳng từ tài liệu rồi để máy tự
// bịa mồi nhử bằng cách bốc đáp án của câu khác. Kết quả sai về nguyên tắc:
//     "Hợp chất nào của nitơ dùng làm chất gây lạnh?"  →  Đức · tâm · NH3 · xiếc
// Kho kiến thức tổng hợp thì "cùng loại" chẳng có nghĩa gì — chỉ NH3 là công thức hoá học
// nên bé khoanh trúng mà không cần biết gì. MỒI NHỬ PHẢI DO NGƯỜI VIẾT, cho từng câu một.
//
// ĐÃ LỌC BỎ khỏi 91 câu gốc (khảo sát thấy 38 câu hỏng):
//   - 9 câu "A hay B?" — đáp án nằm ngay trong đề, đọc là thấy
//   - 6 câu có sẵn "a. b. c. d." trong đề — trùng luôn với 4 nút bấm
//   - 6 câu điền vào chỗ trống — không hợp dạng trắc nghiệm
//   - 2 câu liệt kê sẵn lựa chọn trong đề
//   - các câu quá chuyên sâu (giải tích, hoá hữu cơ) và các câu đề dài lê thê
// Một số câu được RÚT GỌN cho vừa màn hình, giữ nguyên ý.

export const OLYMPIA = [
  // ── Địa lý ────────────────────────────────────────────────────────────────
  {
    id: 'ol-dl1',
    nhom: 'diali',
    q: 'Đèo Hải Vân cắt ngang dãy núi nào của Trường Sơn?',
    ans: 'Dãy Bạch Mã',
    sai: ['Dãy Hoành Sơn', 'Dãy Tam Đảo', 'Dãy Ngân Sơn'],
  },
  {
    id: 'ol-dl2',
    nhom: 'diali',
    q: 'Phố cổ Hội An nằm ở hạ lưu con sông nào?',
    ans: 'Sông Thu Bồn',
    sai: ['Sông Hương', 'Sông Trà Khúc', 'Sông Gianh'],
  },
  {
    id: 'ol-dl3',
    nhom: 'diali',
    q: 'Sa mạc nào khô hạn nhất thế giới?',
    ans: 'Sa mạc Atacama',
    sai: ['Sa mạc Sahara', 'Sa mạc Gobi', 'Sa mạc Kalahari'],
  },
  {
    id: 'ol-dl4',
    nhom: 'diali',
    q: 'Hồ nào sâu nhất thế giới?',
    ans: 'Hồ Baikal',
    sai: ['Hồ Victoria', 'Biển Hồ', 'Hồ Superior'],
  },
  {
    id: 'ol-dl5',
    nhom: 'diali',
    q: 'Dãy núi nào là ranh giới tự nhiên giữa châu Á và châu Âu?',
    ans: 'Dãy Ural',
    sai: ['Dãy Alps', 'Dãy Kavkaz', 'Dãy Himalaya'],
  },
  {
    id: 'ol-dl6',
    nhom: 'diali',
    q: 'Biển nào có độ mặn lớn nhất thế giới?',
    ans: 'Biển Chết',
    sai: ['Biển Đỏ', 'Biển Đen', 'Địa Trung Hải'],
  },
  {
    id: 'ol-dl7',
    nhom: 'diali',
    q: 'Nước ta nằm ở múi giờ thứ mấy?',
    ans: 'Múi giờ số 7',
    sai: ['Múi giờ số 6', 'Múi giờ số 8', 'Múi giờ số 9'],
  },
  {
    id: 'ol-dl8',
    nhom: 'diali',
    q: 'Tỉnh nào có diện tích nhỏ nhất Việt Nam?',
    ans: 'Bắc Ninh',
    sai: ['Hà Nam', 'Hưng Yên', 'Vĩnh Phúc'],
  },
  {
    id: 'ol-dl9',
    nhom: 'diali',
    q: 'Đảo lớn nhất thế giới là đảo nào?',
    ans: 'Greenland',
    sai: ['Madagascar', 'Borneo', 'Sumatra'],
  },
  {
    id: 'ol-dl10',
    nhom: 'diali',
    q: 'Cố đô của Nhật Bản là thành phố nào?',
    ans: 'Kyoto',
    sai: ['Osaka', 'Tokyo', 'Nagoya'],
  },
  {
    id: 'ol-dl11',
    nhom: 'diali',
    q: 'Đỉnh núi cao nhất Việt Nam nằm ở tỉnh nào?',
    ans: 'Lào Cai',
    sai: ['Lai Châu', 'Hà Giang', 'Sơn La'],
  },

  // ── Lịch sử ───────────────────────────────────────────────────────────────
  {
    id: 'ol-ls1',
    nhom: 'lichsu',
    q: 'Lễ hội Lam Kinh ở Thanh Hoá tưởng nhớ vị anh hùng nào?',
    ans: 'Lê Lợi',
    sai: ['Quang Trung', 'Trần Hưng Đạo', 'Ngô Quyền'],
  },
  {
    id: 'ol-ls2',
    nhom: 'lichsu',
    q: 'Trần Quốc Toản bóp nát quả cam trong sự kiện nào?',
    ans: 'Hội nghị Bình Than',
    sai: ['Hội nghị Diên Hồng', 'Hội thề Đông Quan', 'Hội thề Lũng Nhai'],
  },
  {
    id: 'ol-ls3',
    nhom: 'lichsu',
    q: 'Thương cảng nào là thương cảng đầu tiên của nước ta?',
    ans: 'Vân Đồn',
    sai: ['Hội An', 'Phố Hiến', 'Thị Nại'],
  },
  {
    id: 'ol-ls4',
    nhom: 'lichsu',
    q: 'Ai là tổng thống da đen đầu tiên của Nam Phi?',
    ans: 'Nelson Mandela',
    sai: ['Martin Luther King', 'Barack Obama', 'Kofi Annan'],
  },
  {
    id: 'ol-ls5',
    nhom: 'lichsu',
    q: 'Văn kiện nào được Hồ Chí Minh viết tại nhà 48 Hàng Ngang?',
    ans: 'Tuyên ngôn Độc lập',
    sai: ['Lời kêu gọi kháng chiến', 'Đường Kách mệnh', 'Nhật ký trong tù'],
  },
  {
    id: 'ol-ls6',
    nhom: 'lichsu',
    q: 'Ai được coi là người đặt tên nước ta là Việt Nam?',
    ans: 'Nguyễn Bỉnh Khiêm',
    sai: ['Nguyễn Trãi', 'Lê Quý Đôn', 'Ngô Sĩ Liên'],
  },
  {
    id: 'ol-ls7',
    nhom: 'lichsu',
    q: 'Toà thành nào tiêu biểu cho kiến trúc quân sự cổ Việt Nam?',
    ans: 'Thành nhà Hồ',
    sai: ['Thành Cổ Loa', 'Kinh thành Huế', 'Thành Gia Định'],
  },
  {
    id: 'ol-ls8',
    nhom: 'lichsu',
    q: 'Cách mạng tư sản đầu tiên trên thế giới diễn ra ở nước nào?',
    ans: 'Hà Lan',
    sai: ['Anh', 'Pháp', 'Mỹ'],
  },

  // ── Khoa học tự nhiên ─────────────────────────────────────────────────────
  {
    id: 'ol-kh1',
    nhom: 'khtn',
    q: 'Trẻ em từ 2 đến 6 tuổi có bao nhiêu chiếc răng sữa?',
    ans: '20 chiếc',
    sai: ['24 chiếc', '28 chiếc', '32 chiếc'],
  },
  {
    id: 'ol-kh2',
    nhom: 'khtn',
    q: 'Tổn thương bán cầu não phải có thể gây liệt nửa thân bên nào?',
    ans: 'Bên trái',
    sai: ['Bên phải', 'Cả hai bên', 'Không bên nào'],
  },
  {
    id: 'ol-kh3',
    nhom: 'khtn',
    q: 'Vitamin nào bị tiêu huỷ nhiều nhất khi hút thuốc lá?',
    ans: 'Vitamin C',
    sai: ['Vitamin A', 'Vitamin D', 'Vitamin K'],
  },
  {
    id: 'ol-kh4',
    nhom: 'khtn',
    q: 'Khí trơ nào trong tiếng Hy Lạp có nghĩa là "mới"?',
    ans: 'Neon',
    sai: ['Argon', 'Krypton', 'Xenon'],
  },
  {
    id: 'ol-kh5',
    nhom: 'khtn',
    q: 'Tế bào nào dài nhất trong cơ thể người?',
    ans: 'Tế bào thần kinh',
    sai: ['Tế bào cơ', 'Tế bào gan', 'Tế bào máu'],
  },
  {
    id: 'ol-kh6',
    nhom: 'khtn',
    q: 'Ngà voi là bộ phận nào biến đổi thành?',
    ans: 'Răng cửa',
    sai: ['Răng nanh', 'Xương hàm', 'Sừng'],
  },
  {
    id: 'ol-kh7',
    nhom: 'khtn',
    q: 'Tổ tiên của loài chim là loài nào?',
    ans: 'Bò sát',
    sai: ['Lưỡng cư', 'Thú có túi', 'Cá'],
  },
  {
    id: 'ol-kh8',
    nhom: 'khtn',
    q: 'Người nhóm máu nào nhận được máu của mọi nhóm còn lại?',
    ans: 'Nhóm AB',
    sai: ['Nhóm O', 'Nhóm A', 'Nhóm B'],
  },
  {
    id: 'ol-kh9',
    nhom: 'khtn',
    q: 'Hợp chất nào của nitơ ở dạng lỏng từng dùng làm chất gây lạnh?',
    ans: 'NH3',
    sai: ['NO2', 'N2O', 'HNO3'],
  },
  {
    id: 'ol-kh10',
    nhom: 'khtn',
    q: 'Phèn chua là muối kép của hai kim loại nào?',
    ans: 'Kali và nhôm',
    sai: ['Natri và sắt', 'Canxi và magie', 'Kali và đồng'],
  },
  {
    id: 'ol-kh11',
    nhom: 'khtn',
    q: 'Con vật nào to nhất trên Trái Đất?',
    ans: 'Cá voi xanh',
    sai: ['Voi châu Phi', 'Cá mập trắng', 'Hươu cao cổ'],
  },
  {
    id: 'ol-kh12',
    nhom: 'khtn',
    q: 'Hành tinh nào gần Mặt Trời nhất?',
    ans: 'Sao Thuỷ',
    sai: ['Sao Kim', 'Sao Hoả', 'Trái Đất'],
  },
  {
    id: 'ol-kh13',
    nhom: 'khtn',
    q: 'Hành tinh nào to nhất trong hệ Mặt Trời?',
    ans: 'Sao Mộc',
    sai: ['Sao Thổ', 'Sao Hải Vương', 'Trái Đất'],
  },
  {
    id: 'ol-kh14',
    nhom: 'khtn',
    q: 'Nhiệt kế thuỷ ngân hoạt động dựa trên nguyên lý nào?',
    ans: 'Nở vì nhiệt',
    sai: ['Dẫn nhiệt', 'Đối lưu', 'Bức xạ nhiệt'],
  },
  {
    id: 'ol-kh15',
    nhom: 'khtn',
    q: 'Thuỷ tinh thể của mắt là dụng cụ quang học gì?',
    ans: 'Thấu kính hội tụ',
    sai: ['Thấu kính phân kì', 'Gương cầu lồi', 'Lăng kính'],
  },
  {
    id: 'ol-kh16',
    nhom: 'khtn',
    q: 'Động vật nguyên sinh nào vừa giống động vật vừa giống thực vật?',
    ans: 'Trùng roi xanh',
    sai: ['Trùng biến hình', 'Trùng giày', 'Trùng sốt rét'],
  },
  {
    id: 'ol-kh17',
    nhom: 'khtn',
    q: 'Loại đường nào có nhiều trong mật ong?',
    ans: 'Fructozơ',
    sai: ['Saccarozơ', 'Lactozơ', 'Tinh bột'],
  },
  {
    id: 'ol-kh18',
    nhom: 'khtn',
    q: 'Loài thú nào đẻ trứng?',
    ans: 'Thú mỏ vịt',
    sai: ['Dơi', 'Chuột chũi', 'Nhím'],
  },

  // ── Toán ──────────────────────────────────────────────────────────────────
  {
    id: 'ol-tn1',
    nhom: 'toan',
    q: 'Số lẻ nhỏ nhất có 4 chữ số khác nhau là số nào?',
    ans: '1023',
    sai: ['1013', '1035', '1024'],
  },
  {
    id: 'ol-tn2',
    nhom: 'toan',
    q: 'Số nguyên tố lớn nhất có 2 chữ số là số nào?',
    ans: '97',
    sai: ['91', '93', '99'],
  },
  {
    id: 'ol-tn3',
    nhom: 'toan',
    q: 'Một tháng có nhiều nhất bao nhiêu ngày chủ nhật?',
    ans: '5 ngày',
    sai: ['4 ngày', '6 ngày', '7 ngày'],
  },
  {
    id: 'ol-tn4',
    nhom: 'toan',
    q: 'Có bao nhiêu số chẵn có hai chữ số khác nhau?',
    ans: '41 số',
    sai: ['45 số', '40 số', '36 số'],
  },
  {
    id: 'ol-tn5',
    nhom: 'toan',
    q: 'Tam giác có 3 cạnh gấp đôi thì diện tích gấp mấy lần?',
    ans: '4 lần',
    sai: ['2 lần', '3 lần', '8 lần'],
  },
  {
    id: 'ol-tn6',
    nhom: 'toan',
    q: 'Số hạng tiếp theo của dãy 1, 3, 6, 10, 15, … là số nào?',
    ans: '21',
    sai: ['20', '18', '25'],
  },
  {
    id: 'ol-tn7',
    nhom: 'toan',
    q: 'Dãy 8, 13, 18, 23, …, 63, 68 có bao nhiêu số hạng?',
    ans: '13 số hạng',
    sai: ['12 số hạng', '14 số hạng', '15 số hạng'],
  },

  // ── Văn học – nghệ thuật ──────────────────────────────────────────────────
  {
    id: 'ol-vh1',
    nhom: 'vanhoc',
    q: 'Chị Thao, Nho, Phương Định là nhân vật trong tác phẩm nào?',
    ans: 'Những ngôi sao xa xôi',
    sai: ['Chiếc lược ngà', 'Lặng lẽ Sa Pa', 'Bến quê'],
  },
  {
    id: 'ol-vh2',
    nhom: 'vanhoc',
    q: 'Tnú là nhân vật chính trong tác phẩm nào của Nguyên Ngọc?',
    ans: 'Rừng xà nu',
    sai: ['Đất nước đứng lên', 'Mảnh trăng cuối rừng', 'Vợ chồng A Phủ'],
  },
  {
    id: 'ol-vh3',
    nhom: 'vanhoc',
    q: 'Truyện "Con cáo và chùm nho" của Aesop thuộc thể loại gì?',
    ans: 'Truyện ngụ ngôn',
    sai: ['Truyện cổ tích', 'Truyện cười', 'Truyền thuyết'],
  },
  {
    id: 'ol-vh4',
    nhom: 'vanhoc',
    q: 'Danh hoạ nào mở đường cho trường phái lập thể thế kỷ 20?',
    ans: 'Pablo Picasso',
    sai: ['Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'],
  },
  {
    id: 'ol-vh5',
    nhom: 'vanhoc',
    q: 'Nhà hát Opera Sydney còn được gọi bằng tên nào?',
    ans: 'Nhà hát Con Sò',
    sai: ['Nhà hát Cánh Buồm', 'Nhà hát Vỏ Ốc', 'Nhà hát Cánh Chim'],
  },
  {
    id: 'ol-vh6',
    nhom: 'vanhoc',
    q: 'Tỉnh nào được coi là trung tâm của nghệ thuật hát xoan?',
    ans: 'Phú Thọ',
    sai: ['Bắc Ninh', 'Nam Định', 'Hà Nam'],
  },
  {
    id: 'ol-vh7',
    nhom: 'vanhoc',
    q: 'Hội Lim — hội hát quan họ — được tổ chức ở tỉnh nào?',
    ans: 'Bắc Ninh',
    sai: ['Bắc Giang', 'Hải Dương', 'Hưng Yên'],
  },
  {
    id: 'ol-vh8',
    nhom: 'vanhoc',
    q: 'Múa sạp là nghệ thuật đặc sắc của dân tộc nào?',
    ans: 'Dân tộc Mường',
    sai: ['Dân tộc Tày', 'Dân tộc Ê Đê', 'Dân tộc Chăm'],
  },

  // ── Đời sống – thể thao ───────────────────────────────────────────────────
  {
    id: 'ol-ds1',
    nhom: 'doisong',
    q: 'World Cup 2018 được tổ chức ở nước nào?',
    ans: 'Nga',
    sai: ['Brazil', 'Qatar', 'Nam Phi'],
  },
  {
    id: 'ol-ds2',
    nhom: 'doisong',
    q: 'Giải quần vợt nào có lịch sử lâu đời nhất thế giới?',
    ans: 'Wimbledon',
    sai: ['Roland Garros', 'US Open', 'Australian Open'],
  },
  {
    id: 'ol-ds3',
    nhom: 'doisong',
    q: 'Môn võ Aikido bắt nguồn từ nước nào?',
    ans: 'Nhật Bản',
    sai: ['Hàn Quốc', 'Trung Quốc', 'Thái Lan'],
  },
  {
    id: 'ol-ds4',
    nhom: 'doisong',
    q: 'Rét nàng Bân ở miền Bắc thường vào tháng mấy âm lịch?',
    ans: 'Tháng 3',
    sai: ['Tháng 1', 'Tháng 2', 'Tháng 4'],
  },
  {
    id: 'ol-ds5',
    nhom: 'doisong',
    q: 'Trên quốc huy nước ta, hình nào tượng trưng cho công nghiệp?',
    ans: 'Bánh răng',
    sai: ['Bông lúa', 'Ngôi sao vàng', 'Búa liềm'],
  },
  {
    id: 'ol-ds6',
    nhom: 'doisong',
    q: 'Wall Street là địa danh nổi tiếng về lĩnh vực nào?',
    ans: 'Chứng khoán',
    sai: ['Điện ảnh', 'Thời trang', 'Công nghệ'],
  },
  {
    id: 'ol-ds7',
    nhom: 'doisong',
    q: 'WHO là tên viết tắt của tổ chức nào?',
    ans: 'Tổ chức Y tế Thế giới',
    sai: ['Tổ chức Thương mại Thế giới', 'Tổ chức Lao động Quốc tế', 'Quỹ Nhi đồng Liên hợp quốc'],
  },
  {
    id: 'ol-ds8',
    nhom: 'doisong',
    q: 'Kẹo mạch nha được làm từ nguyên liệu gì?',
    ans: 'Mầm lúa',
    sai: ['Mật ong', 'Nước dừa', 'Củ cải đường'],
  },
  {
    id: 'ol-ds9',
    nhom: 'doisong',
    q: 'Danh hiệu cao quý nhất phong cho nhà giáo là gì?',
    ans: 'Nhà giáo Nhân dân',
    sai: ['Nhà giáo Ưu tú', 'Nhà giáo Tiêu biểu', 'Nhà giáo Xuất sắc'],
  },
];

// Nhóm để chia cấp độ trong game.
export const NHOM_OLYMPIA = [
  { id: 'khtn', ten: '🔬 Khoa học tự nhiên' },
  { id: 'diali', ten: '🌏 Địa lý' },
  { id: 'lichsu', ten: '🏛️ Lịch sử' },
  { id: 'vanhoc', ten: '📖 Văn học' },
  { id: 'toan', ten: '🔢 Toán đố' },
  { id: 'doisong', ten: '⚽ Đời sống' },
  { id: 'tatca', ten: '🎲 Trộn tất cả' },
];
