// systems/spawner.js — sinh vật cản/quái/vật phẩm. Tách từ spawnWave()/mkObs() của legacy.
//
// Vòng sinh đầy đủ (chọn ngẫu nhiên loại, dựng vật ghép net/laser/bridge/vineGap, rải xu)
// còn phụ thuộc trạng thái G và sẽ ghép ở bước tích hợp. Ở đây tách các mảnh THUẦN,
// kiểm chứng được: đặt cao độ vật cản, giãn cách vật cản, và chu kỳ sinh.

// Cao độ y khi sinh vật cản (từ mkObs của legacy). def = mục trong OBS.
export function obstacleY(def, type, stage, rnd, C) {
  const { GY, CEIL, CEIL3 } = C;
  if (def.top) return stage.space ? CEIL3 : CEIL; // treo từ trần
  if (type === 'lowPipe' || type === 'drip' || type === 'branch') return 0; // mọc từ trần xuống
  if (def.fly === 3) return rnd(CEIL3 + 40, GY - 140);
  if (def.fly === 2 && stage.space) return rnd(CEIL3 + 40, GY - 160);
  if (def.fly === 2 && stage.water) return rnd(CEIL + 50, GY - 150);
  return def.fly === 1 ? GY - 186 : def.fly === 2 ? GY - 160 : GY - def.h;
}

// Khoảng cách (px) tới cụm vật cản kế tiếp. p = tiến độ cửa (0..1). extra = bề rộng vật
// đôi thêm vào. Công thức gốc: cửa càng về sau (p lớn) càng dày. diffGap = DF().gap.
export function obstacleGap(speed, gapK, p, extra, rnd, diffGap = 1) {
  return (extra + speed * gapK * (1 - 0.14 * p) + 140 + rnd(0, 180 - 90 * p)) * diffGap;
}

// Đổi khoảng cách px thành thời gian chờ (giây) theo tốc độ cuộn hiện tại.
export const spawnInterval = (gap, vspd) => gap / Math.max(60, vspd);
