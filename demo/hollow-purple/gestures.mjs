/**
 * Nhận diện ấn tay Hư Thức "Tử" (虚式「茈」) từ 21 landmark của MediaPipe Hand Landmarker.
 *
 * Thứ tự ấn theo Jujutsu Kaisen Wiki:
 *   1) Duỗi ngón trỏ + ngón út, các ngón còn lại gập.
 *   2) Chụm ngón cái + ngón trỏ, đồng thời duỗi ngón giữa.
 *   3) Bung các ngón ra như vụ nổ → kích hoạt.
 *
 * Tệp này không phụ thuộc DOM/Three.js để test được bằng Node.
 */

export const POSE = {
  NONE: 'none',
  SIGN_1: 'sign1',
  SIGN_2: 'sign2',
  RELEASED: 'released',
};

const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };
const FINGERS = ['index', 'middle', 'ring', 'pinky'];

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(dx, dy, dz);
}

/** Kích thước bàn tay làm đơn vị chuẩn hoá, để ngưỡng không phụ thuộc khoảng cách tới camera. */
function handScale(lm) {
  return Math.max(dist(lm[0], lm[9]), 1e-6);
}

function palmCenter(lm) {
  const ids = [0, 5, 9, 13, 17];
  let x = 0;
  let y = 0;
  let z = 0;
  for (const i of ids) {
    x += lm[i].x;
    y += lm[i].y;
    z += lm[i].z ?? 0;
  }
  return { x: x / ids.length, y: y / ids.length, z: z / ids.length };
}

/**
 * Trích đặc trưng bàn tay. Trả về null nếu landmark không hợp lệ.
 * `ext[f]` = ngón f duỗi ra (đầu ngón xa lòng bàn tay hơn khớp giữa).
 */
export function analyzeHand(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) return null;
  const scale = handScale(landmarks);
  const palm = palmCenter(landmarks);

  const ext = {};
  for (const finger of FINGERS) {
    const tipD = dist(landmarks[TIP[finger]], palm);
    const pipD = dist(landmarks[PIP[finger]], palm);
    ext[finger] = tipD > pipD * 1.12;
  }

  const pinchGap = dist(landmarks[4], landmarks[8]) / scale;
  const pinch = pinchGap < 0.5;
  ext.thumb = dist(landmarks[4], landmarks[17]) / scale > 1.15;

  const spread =
    FINGERS.reduce((sum, f) => sum + dist(landmarks[TIP[f]], palm) / scale, 0) / FINGERS.length;

  return { ext, pinch, pinchGap, spread, scale };
}

export function classifyFeatures(hand) {
  const { ext, pinch } = hand;
  const fourOpen = ext.index && ext.middle && ext.ring && ext.pinky;
  if (fourOpen) return POSE.RELEASED;
  // Ngón trỏ đang chụm vào ngón cái nên không còn "duỗi" theo tiêu chí khoảng cách.
  if (pinch && ext.middle && !ext.ring) return POSE.SIGN_2;
  if (ext.index && ext.pinky && !ext.middle && !ext.ring && !pinch) return POSE.SIGN_1;
  return POSE.NONE;
}

/** Phân loại một khung hình thành 1 trong 4 trạng thái ấn. */
export function classifyPose(landmarks) {
  const hand = analyzeHand(landmarks);
  if (!hand) return POSE.NONE;
  return classifyFeatures(hand);
}

/**
 * Máy trạng thái 3 bước: ấn 1 → ấn 2 → bung tay.
 * Có hết hạn để tránh vô tình kích hoạt khi người dùng giữ tay ở ấn 1.
 */
export function createSequenceDetector({ armTimeoutMs = 4000, releaseTimeoutMs = 1400 } = {}) {
  let stage = 'idle';
  let since = 0;

  return {
    get stage() {
      return stage;
    },
    reset() {
      stage = 'idle';
    },
    /**
     * @param {string} pose kết quả classifyPose
     * @param {number} now ms
     * @returns {'fire'|'arm'|'charge'|null}
     */
    update(pose, now) {
      if (stage === 'idle') {
        if (pose === POSE.SIGN_1) {
          stage = 'armed';
          since = now;
          return 'arm';
        }
        return null;
      }

      if (stage === 'armed') {
        if (now - since > armTimeoutMs) {
          stage = 'idle';
          return null;
        }
        if (pose === POSE.SIGN_2) {
          stage = 'charged';
          since = now;
          return 'charge';
        }
        return null;
      }

      // charged
      if (pose === POSE.RELEASED) {
        stage = 'idle';
        return 'fire';
      }
      if (now - since > releaseTimeoutMs) {
        // Giữ ấn 2 quá lâu: vẫn bung, tránh kẹt trạng thái khi mất dấu tay.
        stage = 'idle';
        return 'fire';
      }
      return null;
    },
  };
}
