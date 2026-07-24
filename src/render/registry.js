// render/registry.js — bảng đăng ký đồ hoạ GFX. Xương sống của lớp vẽ (ARCHITECTURE.md).
//
//   GFX = { scene, obs, mob, boss, hero, item, hazard, palette }
//   scene/obs/mob : một hàm cho mỗi THẾ GIỚI (land/sea/space/ice/sewer/jungle)
//   boss          : một hàm cho mỗi TRÙM
//   hero          : { vector, blocky }  (vector = Doraemon+Việt, blocky = Minecraft)
//   item/hazard   : hàm vẽ vật phẩm / bẫy
//
// Thêm THẾ GIỚI mới = thêm một hàng; thêm BỘ ĐỒ HOẠ mới = thêm một tệp skin + cột.
// Mã vẽ chi tiết (render/worlds/*, render/skins/*) còn nằm trong legacy, sẽ ghép ở bước
// tích hợp. createRegistry() ở đây là bộ LẮP RÁP + KIỂM TRA ĐỦ CỘT để bắt lỗi thiếu sót
// (lỗi lịch sử #7, #12: cơ chế/hình thiếu ở một bộ đồ hoạ → ném undefined lúc chạy).

export const WORLDS = ['land', 'sea', 'space', 'ice', 'sewer', 'jungle'];
export const BOSSES = ['dragon', 'kraken', 'robot', 'titan', 'rat', 'monkey'];
export const HERO_STYLES = ['vector', 'blocky'];
export const HAZARDS = ['pillar', 'whirl', 'gzone', 'vine'];

function needKeys(tbl, keys, name) {
  if (!tbl) throw new Error(`GFX.${name} chưa được cung cấp`);
  for (const k of keys)
    if (typeof tbl[k] !== 'function') throw new Error(`GFX.${name} thiếu hàm '${k}'`);
}

// Lắp ráp GFX từ các bảng cài đặt, đồng thời KIỂM TRA đủ mọi thế giới/trùm/hazard.
export function createRegistry(impl) {
  const { scene, obs, mob, boss, hero, item, hazard, palette } = impl;
  needKeys(scene, WORLDS, 'scene');
  needKeys(obs, WORLDS, 'obs');
  needKeys(mob, WORLDS, 'mob');
  needKeys(boss, BOSSES, 'boss');
  needKeys(hero, HERO_STYLES, 'hero');
  needKeys(hazard, HAZARDS, 'hazard');
  if (typeof item !== 'function') throw new Error('GFX.item phải là một hàm');
  return { scene, obs, mob, boss, hero, item, hazard, palette };
}
