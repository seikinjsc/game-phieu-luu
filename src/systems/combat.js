// systems/combat.js — va chạm & nhận sát thương. Tách từ update() của legacy.
//
// Phần chiến đấu đầy đủ (chém trùm, đè đầu quái, hao độ bền vũ khí) còn nằm rải trong
// update() monolith và sẽ ghép ở bước tích hợp. Ở đây tách 2 mảnh THUẦN, kiểm chứng được:
//   aabb()     kiểm hai hộp chữ nhật có chồng nhau không (dùng khắp nơi).
//   applyHit() quy trình NHẬN đòn: khiên đỡ → bất tử tạm → mất tim → vỡ giáp → thua.

// Chồng hộp AABB (đúng biên như legacy: dùng > và <).
export const aabb = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Nhân vật nhận một đòn. Trả về true nếu đòn "ăn" (để bên gọi đánh dấu đã trúng),
// false nếu bị bỏ qua (đang bất tử / admin bất tử).
// ctx: { adm, sfx:{hit,boom}, wearArmor, wearBoots, endStage, spark, px, py }
export function applyHit(G, ctx = {}, fromObs = false) {
  const adm = ctx.adm || {};
  const sfx = ctx.sfx || {};
  const spark = ctx.spark || (() => {});
  const wearArmor = ctx.wearArmor || (() => {});
  const wearBoots = ctx.wearBoots || (() => {});
  const endStage = ctx.endStage || (() => {});
  const px = ctx.px ?? 0,
    py = ctx.py ?? 0;

  if (adm.inv) return false;
  if (G.inv > 0) return false;
  if (G.pw.sh) {
    G.pw.sh = false;
    G.inv = 1.1;
    sfx.boom && sfx.boom();
    spark(px, py, '#7BE0FF', 14);
    return true;
  }
  G.hearts--;
  G.inv = 1.35;
  G.shake = 0.35;
  sfx.hit && sfx.hit();
  spark(px, py, '#FF6B6B');
  wearArmor();
  if (fromObs) wearBoots();
  if (G.hearts <= 0) endStage(false);
  return true;
}
