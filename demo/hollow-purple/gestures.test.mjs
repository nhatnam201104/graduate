import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPose, createSequenceDetector, POSE, analyzeHand } from './gestures.mjs';

/** Dựng 21 landmark tổng hợp. scale > 0 mô phỏng tay to/nhỏ (xa/gần camera). */
function makeHand({ extended = [], pinch = false, scale = 1 } = {}) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  const s = scale;
  lm[0] = { x: 0, y: 0, z: 0 };
  lm[5] = { x: 0.2 * s, y: 0.5 * s, z: 0 };
  lm[9] = { x: 0.0, y: 0.55 * s, z: 0 };
  lm[13] = { x: -0.2 * s, y: 0.5 * s, z: 0 };
  lm[17] = { x: -0.35 * s, y: 0.42 * s, z: 0 };

  const pip = {
    index: { x: 0.21 * s, y: 0.85 * s },
    middle: { x: 0.0, y: 0.68 * s },
    ring: { x: -0.2 * s, y: 0.68 * s },
    pinky: { x: -0.37 * s, y: 0.68 * s },
  };
  const tipOpen = {
    index: { x: 0.22 * s, y: 1.15 * s },
    middle: { x: 0.0, y: 1.2 * s },
    ring: { x: -0.22 * s, y: 1.15 * s },
    pinky: { x: -0.4 * s, y: 0.95 * s },
  };
  const tipFolded = {
    index: { x: 0.02 * s, y: 0.42 * s },
    middle: { x: 0.02 * s, y: 0.42 * s },
    ring: { x: -0.02 * s, y: 0.4 * s },
    pinky: { x: -0.05 * s, y: 0.38 * s },
  };
  const pipIdx = { index: 6, middle: 10, ring: 14, pinky: 18 };
  const tipIdx = { index: 8, middle: 12, ring: 16, pinky: 20 };

  for (const f of ['index', 'middle', 'ring', 'pinky']) {
    lm[pipIdx[f]] = { x: pip[f].x, y: pip[f].y, z: 0 };
    const t = extended.includes(f) ? tipOpen[f] : tipFolded[f];
    lm[tipIdx[f]] = { x: t.x, y: t.y, z: 0 };
  }

  if (pinch) {
    // Ngón cái và ngón trỏ chạm nhau
    lm[4] = { x: 0.15 * s, y: 0.95 * s, z: 0 };
    lm[8] = { x: 0.18 * s, y: 0.93 * s, z: 0 };
  } else {
    lm[4] = { x: -0.7 * s, y: 0.15 * s, z: 0 };
  }
  return lm;
}

const sign1Hand = () => makeHand({ extended: ['index', 'pinky'] });
const sign2Hand = () => makeHand({ extended: ['middle'], pinch: true });
const openHand = () => makeHand({ extended: ['index', 'middle', 'ring', 'pinky'] });

test('ấn 1: trỏ + út duỗi, giữa và áp út gập', () => {
  assert.equal(classifyPose(sign1Hand()), POSE.SIGN_1);
});

test('ấn 2: chụm cái + trỏ, ngón giữa duỗi, áp út gập', () => {
  const hand = analyzeHand(sign2Hand());
  assert.equal(hand.pinch, true, 'phải nhận ra chụm tay');
  assert.equal(classifyPose(sign2Hand()), POSE.SIGN_2);
});

test('bung tay: cả bốn ngón duỗi', () => {
  assert.equal(classifyPose(openHand()), POSE.RELEASED);
});

test('landmark không hợp lệ trả về NONE, không ném lỗi', () => {
  assert.equal(classifyPose(null), POSE.NONE);
  assert.equal(classifyPose([]), POSE.NONE);
  assert.equal(classifyPose(new Array(10).fill({ x: 0, y: 0, z: 0 })), POSE.NONE);
});

test('tay xa camera (scale nhỏ 0.4) vẫn phân loại đúng — ngưỡng đã chuẩn hoá', () => {
  assert.equal(classifyPose(makeHand({ extended: ['index', 'pinky'], scale: 0.4 })), POSE.SIGN_1);
  assert.equal(classifyPose(makeHand({ extended: ['middle'], pinch: true, scale: 0.4 })), POSE.SIGN_2);
  assert.equal(
    classifyPose(makeHand({ extended: ['index', 'middle', 'ring', 'pinky'], scale: 0.4 })),
    POSE.RELEASED,
  );
});

test('tay gần camera (scale 2.2) vẫn phân loại đúng', () => {
  assert.equal(classifyPose(makeHand({ extended: ['index', 'pinky'], scale: 2.2 })), POSE.SIGN_1);
  assert.equal(classifyPose(makeHand({ extended: ['middle'], pinch: true, scale: 2.2 })), POSE.SIGN_2);
});

test('chuỗi hợp lệ ấn 1 → ấn 2 → bung phát ra fire', () => {
  const d = createSequenceDetector();
  assert.equal(d.update(POSE.SIGN_1, 0), 'arm');
  assert.equal(d.stage, 'armed');
  assert.equal(d.update(POSE.SIGN_2, 400), 'charge');
  assert.equal(d.stage, 'charged');
  assert.equal(d.update(POSE.RELEASED, 900), 'fire');
  assert.equal(d.stage, 'idle');
});

test('giữ ấn 1 quá lâu thì huỷ, ấn 2 sau đó không kích hoạt', () => {
  const d = createSequenceDetector({ armTimeoutMs: 4000 });
  d.update(POSE.SIGN_1, 0);
  assert.equal(d.update(POSE.NONE, 1000), null);
  assert.equal(d.update(POSE.SIGN_2, 4500), null);
  assert.equal(d.stage, 'idle');
});

test('mất dấu tay sau ấn 2 quá hạn vẫn bung (không kẹt trạng thái)', () => {
  const d = createSequenceDetector({ releaseTimeoutMs: 1400 });
  d.update(POSE.SIGN_1, 0);
  d.update(POSE.SIGN_2, 200);
  assert.equal(d.update(POSE.NONE, 300), null);
  assert.equal(d.update(POSE.NONE, 1700), 'fire');
  assert.equal(d.stage, 'idle');
});

test('không thể bỏ qua bước: bung tay ngay từ đầu không kích hoạt', () => {
  const d = createSequenceDetector();
  assert.equal(d.update(POSE.RELEASED, 0), null);
  assert.equal(d.stage, 'idle');
});

test('thứ tự sai (ấn 2 trước ấn 1) không kích hoạt', () => {
  const d = createSequenceDetector();
  assert.equal(d.update(POSE.SIGN_2, 0), null);
  assert.equal(d.stage, 'idle');
});

test('sau khi fire có thể nạp lại chuỗi mới', () => {
  const d = createSequenceDetector();
  d.update(POSE.SIGN_1, 0);
  d.update(POSE.SIGN_2, 200);
  d.update(POSE.RELEASED, 400);
  assert.equal(d.update(POSE.SIGN_1, 600), 'arm');
  assert.equal(d.stage, 'armed');
});
