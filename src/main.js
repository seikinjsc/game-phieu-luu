// Điểm vào tạm để chứng minh khung Vite chạy được.
// Code game thật sẽ thay thế tệp này ở các giai đoạn sau (PROMPTS.md GĐ4+).
// __APP_VERSION__ do Vite tiêm từ package.json (xem vite.config.js).
const title = 'Bé Phiêu Lưu v' + __APP_VERSION__;
document.title = title;
document.getElementById('app').textContent = title + ' — khung dự án đã sẵn sàng.';
