// tools/trang-chu.mjs — dựng dist/index.html: trang chọn game.
//
// Trước đây gốc trang web CHÍNH LÀ game 60 cửa (deploy.yml sao game.html thành index.html).
// Nay có hai game nên gốc thành trang chọn. Muốn quay lại như cũ thì bỏ lệnh gọi tệp này
// trong package.json và thêm lại `cp dist/game.html dist/index.html`.
//
// Không dùng thư viện, không tệp ảnh — cùng ràng buộc với phần còn lại của dự án.

import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root)));

const the = (href, icon, ten, mo, mau) => `
      <a class="the" href="${href}" style="--mau:${mau}">
        <div class="icon">${icon}</div>
        <div class="ten">${ten}</div>
        <div class="mo">${mo}</div>
        <div class="choi">▶ Chơi</div>
      </a>`;

const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Game của bé — v${pkg.version}</title>
    <style>
      :root { --navy:#22306E; --pink:#E8447F; }
      * { box-sizing: border-box; }
      body {
        margin: 0; min-height: 100vh; padding: 24px;
        font-family: system-ui, 'Segoe UI', sans-serif;
        background: linear-gradient(180deg, #BFE9FF, #EAF8FF);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      h1 { color: var(--navy); font-size: clamp(1.6rem, 5vw, 2.4rem); font-weight: 900;
           letter-spacing: -1px; text-align: center; margin: 0 0 4px; }
      .phu { color: #5a6376; font-size: .95rem; margin-bottom: 26px; text-align: center; }
      .hang { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; width: 100%; max-width: 760px; }
      .the {
        flex: 1 1 300px; max-width: 350px; text-decoration: none;
        background: #fff; border-radius: 22px; padding: 26px 22px; text-align: center;
        box-shadow: 0 8px 0 #c3ccda, 0 14px 30px rgba(30,60,110,.18);
        transition: transform .12s, box-shadow .12s;
      }
      .the:hover { transform: translateY(-3px); box-shadow: 0 11px 0 #c3ccda, 0 18px 34px rgba(30,60,110,.22); }
      .the:active { transform: translateY(5px); box-shadow: 0 3px 0 #c3ccda; }
      .icon { font-size: 3.4rem; line-height: 1; }
      .ten { color: var(--navy); font-weight: 900; font-size: 1.35rem; margin: 10px 0 6px; }
      .mo { color: #5a6376; font-size: .9rem; min-height: 40px; }
      .choi {
        margin-top: 14px; display: inline-block; padding: 10px 30px; border-radius: 99px;
        background: var(--mau); color: #fff; font-weight: 900; box-shadow: 0 4px 0 rgba(0,0,0,.22);
      }
      footer { margin-top: 28px; color: #7b8798; font-size: .8rem; text-align: center; }
    </style>
  </head>
  <body>
    <h1>🎮 Game của bé</h1>
    <div class="phu">Chọn một trò để bắt đầu</div>
    <div class="hang">${the('game.html', '🏃', 'Bé Phiêu Lưu', '60 cửa ải, 6 thế giới, 6 trùm cuối. Chạy, nhảy, né vật cản.', '#E8447F')}${the('mecung.html', '🧭', 'Mê Cung Tri Thức', 'Đi mê cung, trả lời câu hỏi lấy chìa. Toán · Trạng Nguyên · Olympia.', '#3F7BD6')}</div>
    <footer>Phiên bản ${pkg.version} · chơi được ngoại tuyến sau khi tải xong</footer>
  </body>
</html>
`;

writeFileSync(new URL('dist/index.html', root), html);
console.log(`✓ dist/index.html — trang chọn game (v${pkg.version})`);
