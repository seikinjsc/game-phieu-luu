// systems/physics.js — vật lý 6 thế giới, tách từ hàm update() monolith của legacy.
//
// Trong legacy mọi thứ nằm trong MỘT update() ~490 dòng. Ở đây tách thành:
//   advanceScroll()  phần ĐỘC LẬP thế giới: tính tốc độ cuộn + quãng đường (dist/worldX).
//                    Đây là "engine cuộn" — kiểm chứng khớp bit với legacy (xem test parity).
//   PHYSICS[key]     BẢNG dispatch 6 nhánh (land/sea/space/ice/sewer/jungle) thay cho
//                    if-else lồng nhau. Mỗi nhánh là bước di chuyển dọc/ngang của thế giới đó.
//   worldStep()      gộp: advanceScroll rồi gọi đúng nhánh.
//
// Phụ thuộc (rnd/tone/toast/sfx/puff/endStage/grabVine…) tiêm qua `ctx` — mặc định no-op
// để chạy/kiểm thử độc lập; khi ghép game thì truyền hàm thật vào.
import { W, H, GY, CEIL, CEIL3, VTOP } from '../data/stages.js';

const lerp = (a, b, t) => a + (b - a) * t;
export const VINE_COST = 13;
export const WORLDKEY = ['land', 'sea', 'space', 'ice', 'sewer', 'jungle'];

export const worldKeyOf = (s) =>
  s.jungle
    ? 'jungle'
    : s.sewer
      ? 'sewer'
      : s.ice
        ? 'ice'
        : s.space
          ? 'space'
          : s.water
            ? 'sea'
            : 'land';

const NOOP = () => {};
function ctxDefaults(c = {}) {
  return {
    rnd: c.rnd || ((a, b) => (a + b) / 2),
    toast: c.toast || NOOP,
    tone: c.tone || NOOP,
    sHit: c.sHit || NOOP,
    sJump: c.sJump || NOOP,
    puff: c.puff || NOOP,
    endStage: c.endStage || NOOP,
    releaseVine: c.releaseVine || NOOP,
    grabVine: c.grabVine || NOOP,
    PG: c.PG || {},
    ADM: c.ADM || { inv: 0, o2: 0, spd: 1, hb: 0 },
  };
}

// ── Engine cuộn: tốc độ + quãng đường (độc lập thế giới) ────────────
// opts.admSpd (ADM.spd), opts.diffSp (DF().sp). Giữ nguyên thứ tự phép tính của legacy.
export function advanceScroll(G, dt, stage, opts = {}) {
  const admSpd = opts.admSpd ?? 1,
    diffSp = opts.diffSp ?? 1;
  G.t += dt;
  const p = stage.boss ? 0 : Math.min(1, G.dist / stage.goal);
  if (stage.boss) G.speed = stage.sp[0];
  else
    G.speed =
      p < 0.5
        ? lerp(stage.sp[0], stage.sp[1], p / 0.5)
        : lerp(stage.sp[1], stage.sp[2], (p - 0.5) / 0.5);
  G.phase = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
  G.vspd = G.speed * (G.pw.bo > 0 ? 1.5 : 1) * admSpd * diffSp;
  if (!stage.boss) G.dist += (G.vspd * dt) / 25;
  G.worldX += G.vspd * dt;
}

// Bám ngang về vị trí nghỉ (land/sea/space/sewer dùng chung).
function horizFollow(G, dt) {
  const tgt = 180 + (G.mvR ? 105 : 0) - (G.mvL ? 60 : 0);
  G.kx += (tgt - G.kx) * Math.min(1, dt * 7);
}

export const PHYSICS = {
  // 🌍 chạy-nhảy, giữ nút nhảy cao, đáp nhanh
  land(G, dt, stage, ctx) {
    const c = ctxDefaults(ctx);
    horizFollow(G, dt);
    const k = G.kid,
      bal = G.pw.bal > 0;
    let g = k.vy < 0 && G.hold ? (bal ? 620 : 950) : bal ? 1150 : 1900;
    if (G.mvD && k.air) g = 3400;
    k.vy += g * dt;
    k.y += k.vy * dt;
    if (k.y >= GY) {
      if (k.air) c.puff(4);
      k.y = GY;
      k.vy = 0;
      k.air = false;
    }
  },

  // 🌊 bơi lên/chìm theo nút giữ, quản lý oxy
  sea(G, dt, stage, ctx) {
    const c = ctxDefaults(ctx);
    horizFollow(G, dt);
    const k = G.kid,
      bal = G.pw.bal > 0,
      PG = c.PG,
      ADM = c.ADM;
    const fin = PG.fins ? 1.28 : 1,
      bo = bal ? 1.35 : 1;
    const tv = G.mvD ? 300 * fin : G.hold ? -235 * fin * bo : 165;
    k.vy += (tv - k.vy) * Math.min(1, dt * 5.2);
    k.y += k.vy * dt;
    if (k.y >= GY) {
      k.y = GY;
      k.vy = 0;
      k.air = false;
    } else {
      k.air = true;
      if (k.y < CEIL) {
        k.y = CEIL;
        k.vy = Math.max(0, k.vy);
      }
    }
    if (Math.random() < dt * 9)
      G.fx.push({
        x: G.kx + c.rnd(4, 18),
        y: k.y - 58,
        vx: c.rnd(-8, 12),
        vy: c.rnd(-70, -40),
        life: 0.8,
        max: 0.8,
        r: c.rnd(2, 5),
        c: 'rgba(255,255,255,.75)',
        up: 1,
      });
    if (!ADM.o2) G.o2 -= dt;
    if (G.o2 <= 0) {
      G.o2 = 0;
      G.o2T -= dt;
      if (G.o2T <= 0) {
        G.o2T = 2.6;
        if (G.inv <= 0) {
          G.hearts--;
          G.inv = 1.0;
          G.shake = 0.3;
          c.sHit();
          c.toast('😵 Hết hơi! Tìm bong bóng khí 🫧');
          if (G.hearts <= 0) {
            c.endStage(false);
            return;
          }
        }
      }
    }
    G.bubT -= dt;
    if (G.bubT <= 0) {
      G.bubT = c.rnd(5.2, 7.6);
      G.items.push({
        x: W + 40,
        y: c.rnd(CEIL + 40, GY - 60),
        r: 19,
        kind: 'bubble',
        got: 0,
        sp: 0,
      });
    }
  },

  // 🚀 trọng lực thấp, nhảy đôi, đảo trọng lực
  space(G, dt, stage, ctx) {
    const c = ctxDefaults(ctx);
    horizFollow(G, dt);
    const k = G.kid,
      bal = G.pw.bal > 0,
      PG = c.PG;
    if (G.gvCd > 0) G.gvCd -= dt;
    const gv = G.gv;
    let g = k.vy * gv < 0 && G.hold ? (bal ? 300 : 430) : bal ? 560 : 760;
    k.vy += g * gv * dt;
    k.y += k.vy * dt;
    const flr = gv > 0 ? GY : CEIL3;
    if (gv > 0 ? k.y >= flr : k.y <= flr) {
      if (k.air) c.puff(4);
      k.y = flr;
      k.vy = 0;
      k.air = false;
      k.dj = 0;
    } else k.air = true;
    if (gv > 0 && k.y < CEIL3) {
      k.y = CEIL3;
      k.vy = Math.max(k.vy, 0);
    }
    if (gv < 0 && k.y > GY) {
      k.y = GY;
      k.vy = Math.min(k.vy, 0);
    }
    if (PG.jet && k.air && Math.random() < dt * 14)
      G.fx.push({
        x: G.kx + c.rnd(-8, 8),
        y: k.y - 6 * gv,
        vx: c.rnd(-30, 30),
        vy: c.rnd(60, 140) * gv,
        life: 0.35,
        max: 0.35,
        r: c.rnd(3, 6),
        c: Math.random() < 0.5 ? '#FFD84D' : '#FF8A3D',
        up: gv < 0 ? 1 : 0,
      });
  },

  // ❄️ trượt theo quán tính, gió bão, giữ ấm, khe băng
  ice(G, dt, stage, ctx) {
    const c = ctxDefaults(ctx);
    const k = G.kid,
      bal = G.pw.bal > 0,
      PG = c.PG;
    if (stage.wind) {
      G.windT -= dt;
      if (G.windT <= 0) {
        if (G.wind === 0) {
          G.windDir = Math.random() < 0.5 ? -1 : 1;
          G.wind = G.windDir * c.rnd(140, 270);
          G.windT = c.rnd(1.6, 2.6);
          c.toast(G.windDir > 0 ? '💨 Gió thổi tới trước!' : '💨 Gió thổi ngược lại!');
          c.tone(90, 0.5, 'sawtooth', 0.05);
        } else {
          G.wind = 0;
          G.windT = c.rnd(3.2, 5.6);
        }
      }
    }
    const acc = G.frz ? 460 : 920;
    if (G.mvR) G.kvx += acc * dt;
    if (G.mvL) G.kvx -= acc * dt;
    G.kvx += G.wind * dt;
    G.kvx *= Math.pow(PG.cramp ? 0.03 : 0.42, dt);
    G.kvx = Math.max(-420, Math.min(420, G.kvx));
    G.kx += G.kvx * dt;
    if (G.kx < 95) {
      G.kx = 95;
      G.kvx = Math.max(0, G.kvx);
    }
    if (G.kx > 340) {
      G.kx = 340;
      G.kvx = Math.min(0, G.kvx);
    }
    G.wm -= dt * (G.wind ? 1.5 : 1);
    if (G.wm <= 0) {
      G.wm = 0;
      G.frz = 1;
      G.wmT -= dt;
      if (G.wmT <= 0) {
        G.wmT = 3.0;
        if (G.inv <= 0) {
          G.hearts--;
          G.inv = 1.0;
          G.shake = 0.3;
          c.sHit();
          c.toast('🥶 Lạnh cóng! Tìm lửa 🔥');
          if (G.hearts <= 0) {
            c.endStage(false);
            return;
          }
        }
      }
    } else G.frz = 0;
    G.fireT -= dt;
    if (G.fireT <= 0) {
      G.fireT = c.rnd(5.5, 8.0);
      G.items.push({ x: W + 40, y: GY - c.rnd(40, 150), r: 20, kind: 'fire', got: 0, sp: 0 });
    }
    if (Math.random() < dt * 22)
      G.fx.push({
        x: c.rnd(0, W),
        y: -6,
        vx: -G.vspd * 0.35 + G.wind * 0.5,
        vy: c.rnd(40, 90),
        life: 2.4,
        max: 2.4,
        r: c.rnd(2, 4.5),
        c: 'rgba(255,255,255,.85)',
      });
    // dọc (trượt + nhảy + khe băng)
    const prevY = k.y;
    let g = k.vy < 0 && G.hold ? (bal ? 620 : 950) : bal ? 1150 : 1900;
    if (G.mvD && k.air) g = 3400;
    k.vy += g * dt;
    k.y += k.vy * dt;
    const fx1 = G.kx - 14,
      fx2 = G.kx + 14;
    let onGap = false;
    for (const o of G.obs)
      if (o.gap && fx2 > o.x + 6 && fx1 < o.x + o.w - 6) {
        onGap = true;
        break;
      }
    let floor = onGap ? 99999 : GY;
    for (const o of G.obs)
      if (o.plat && fx2 > o.x + 4 && fx1 < o.x + o.w - 4)
        if (prevY <= o.y + 10 && k.y >= o.y) floor = Math.min(floor, o.y);
    if (k.y >= floor) {
      if (k.air) c.puff(4);
      k.y = floor;
      k.vy = 0;
      k.air = false;
      G.coyote = 0.14 * (PG.cramp ? 1.8 : 1);
      if (G.jbuf > 0) {
        G.jbuf = 0;
        k.vy = -640;
        k.air = true;
        c.sJump();
        c.puff(5);
      }
    } else {
      if (!k.air && G.coyote <= 0) k.air = true;
      if (G.coyote > 0) G.coyote -= dt;
    }
    if (G.jbuf > 0) G.jbuf -= dt;
    if (k.y > H + 70 && !G.fell) {
      G.fell = 1;
      c.sHit();
      G.shake = 0.5;
      c.toast('💀 Rơi xuống khe băng!');
      c.endStage(false, 1);
    }
  },

  // 🕳️ vực chết, ngồi chui, platform
  sewer(G, dt, stage, ctx) {
    const c = ctxDefaults(ctx);
    horizFollow(G, dt);
    const k = G.kid,
      bal = G.pw.bal > 0,
      PG = c.PG;
    const prevY = k.y;
    let g = k.vy < 0 && G.hold ? (bal ? 620 : 950) : bal ? 1150 : 1900;
    k.vy += g * dt;
    k.y += k.vy * dt;
    const fx1 = G.kx - 14,
      fx2 = G.kx + 14;
    let onGap = false;
    for (const o of G.obs)
      if (o.gap && fx2 > o.x + 6 && fx1 < o.x + o.w - 6) {
        onGap = true;
        break;
      }
    let floor = onGap ? 99999 : GY;
    for (const o of G.obs)
      if (o.plat && fx2 > o.x + 4 && fx1 < o.x + o.w - 4)
        if (prevY <= o.y + 10 && k.y >= o.y) floor = Math.min(floor, o.y);
    if (k.y >= floor) {
      if (k.air) c.puff(3);
      k.y = floor;
      k.vy = 0;
      k.air = false;
      G.coyote = 0.13 * (PG.grip ? 2 : 1);
      if (G.jbuf > 0) {
        G.jbuf = 0;
        k.vy = -640;
        k.air = true;
        c.sJump();
        c.puff(5);
      }
    } else {
      if (!k.air && G.coyote <= 0) k.air = true;
      if (G.coyote > 0) G.coyote -= dt;
    }
    if (G.jbuf > 0) G.jbuf -= dt;
    if (k.y > H + 70 && !G.fell) {
      G.fell = 1;
      c.sHit();
      G.shake = 0.5;
      c.toast('💀 Rơi xuống vực!');
      c.endStage(false, 1);
    }
  },

  // 🌴 đu dây con lắc, platform, năng lượng
  jungle(G, dt, stage, ctx) {
    const c = ctxDefaults(ctx);
    const k = G.kid,
      bal = G.pw.bal > 0,
      PG = c.PG;
    if (!G.vine) {
      const tgt = 180 + (G.mvR ? 105 : 0) - (G.mvL ? 60 : 0);
      G.kx += (tgt - G.kx) * Math.min(1, dt * 6);
    }
    G.en = Math.min(G.enM, G.en + (k.air ? 0.6 : 2.6) * dt);
    G.leafT -= dt;
    if (G.leafT <= 0) {
      G.leafT = c.rnd(3.4, 5.4);
      G.items.push({
        x: W + 40,
        y: GY - c.rnd(50, 190),
        r: 19,
        kind: Math.random() < 0.5 ? 'leaf' : 'fruit',
        got: 0,
        sp: 0,
      });
    }
    if (G.vine) {
      const v = G.vine;
      v.t += dt;
      v.av += -(2100 / v.L) * Math.sin(v.ang) * dt;
      v.av *= Math.pow(0.985, dt * 60);
      v.ang += v.av * dt;
      const ax = v.o.x + v.o.w / 2,
        ay = VTOP + 10;
      G.kx = ax + Math.sin(v.ang) * v.L;
      k.y = ay + Math.cos(v.ang) * v.L;
      k.air = true;
      k.vy = 0;
      G.en -= 3.0 * dt;
      if (G.kx < 70 || G.kx > W - 40 || v.t > 3.2 || G.en <= 0) c.releaseVine(0);
    } else {
      const prevY = k.y;
      let g = k.vy < 0 && G.hold ? (bal ? 620 : 950) : bal ? 1150 : 1900;
      if (G.mvD && k.air) g = 3400;
      k.vy += g * dt;
      k.y += k.vy * dt;
      if (k.air && k.vy > -260 && G.en >= VINE_COST) {
        for (const o of G.obs)
          if (o.swing && !o.used) {
            const ax = o.x + o.w / 2,
              r = PG.claw ? 58 : 42;
            if (Math.abs(G.kx - ax) < r && k.y > VTOP + 40 && k.y < VTOP + o.h + 70) {
              o.used = 1;
              c.grabVine(o);
              break;
            }
          }
      }
      if (!G.vine) {
        const fx1 = G.kx - 14,
          fx2 = G.kx + 14;
        let onGap = false;
        for (const o of G.obs)
          if (o.gap && fx2 > o.x + 6 && fx1 < o.x + o.w - 6) {
            onGap = true;
            break;
          }
        let floor = onGap ? 99999 : GY;
        for (const o of G.obs)
          if (o.plat && fx2 > o.x + 4 && fx1 < o.x + o.w - 4)
            if (prevY <= o.y + 10 && k.y >= o.y) floor = Math.min(floor, o.y);
        if (k.y >= floor) {
          if (k.air) c.puff(3);
          k.y = floor;
          k.vy = 0;
          k.air = false;
          G.coyote = 0.13 * (PG.claw ? 1.8 : 1);
          if (G.jbuf > 0) {
            G.jbuf = 0;
            k.vy = -640;
            k.air = true;
            c.sJump();
            c.puff(5);
          }
        } else {
          if (!k.air && G.coyote <= 0) k.air = true;
          if (G.coyote > 0) G.coyote -= dt;
        }
        if (G.jbuf > 0) G.jbuf -= dt;
      }
    }
    G.kx += (180 - G.kx) * Math.min(1, dt * (G.vine ? 0 : 2.2));
    if (k.y > H + 70 && !G.fell) {
      G.fell = 1;
      c.sHit();
      G.shake = 0.5;
      c.toast('💀 Rơi xuống vực!');
      c.endStage(false, 1);
    }
  },
};

// Một bước vật lý đầy đủ: cuộn thế giới rồi chạy nhánh của thế giới hiện tại.
export function worldStep(G, dt, stage, ctx = {}) {
  advanceScroll(G, dt, stage, { admSpd: ctx.ADM?.spd, diffSp: ctx.diffSp });
  PHYSICS[worldKeyOf(stage)](G, dt, stage, ctx);
}
