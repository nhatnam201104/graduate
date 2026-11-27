# Demo — Hư Thức "Tử" (虚式「茈」· Hollow Purple)

Demo khả thi cho hạng mục "một thức" của dự án. Mục tiêu là chứng minh **chuỗi kích hoạt + hiệu ứng** chạy thật, không phải mock.

## Chạy

```bash
cd demo/hollow-purple
python3 -m http.server 8777
# mở http://127.0.0.1:8777
```

Không cần `npm install`, không cần build: Three.js và MediaPipe nạp qua CDN (`importmap` trong `index.html`).

## Ba cách kích hoạt

| Cách | Thao tác |
|---|---|
| Cử chỉ tay (chính) | Bật webcam → **ấn 1** (duỗi trỏ + út) → **ấn 2** (chụm cái + trỏ, duỗi giữa) → **bung tay** |
| Bàn phím | `Space` (hoặc `1` → `2` → `3`) |
| URL (để test/chụp ảnh) | `?state=armed` · `?state=charged` · `?state=flying&hold=0.34` |

`?hold=` ghim tiến trình bay về một mốc 0–1, dùng để chụp ảnh kiểm chứng thay vì phải canh thời điểm.

## Chuỗi hiệu ứng

1. **Ấn 1 → Thương (蒼)**: một quả cầu xanh hội tụ, lõi trắng, đường sức hút vào tâm.
2. **Ấn 2 → Hách (赫)**: quả cầu đỏ xuất hiện đối diện, tia điện nối hai quả cầu, khối tím bắt đầu hình thành ở giữa (va chạm hội tụ × phân kỳ).
3. **Bung tay → Tử**: quả cầu tím lao đi theo hướng mục tiêu, kéo theo vệt năng lượng, để lại vòng xung kích khi chạm, rồi tan và trở về trạng thái chờ.

Thời lượng bay 1,55 s; có cooldown 1 s trước khi nạp lại.

## Kiểm chứng

**Test logic cử chỉ — 12/12 pass:**

```bash
node --test demo/hollow-purple/gestures.test.mjs
```

Phủ: nhận đúng 3 ấn · landmark rỗng/thiếu · tay xa camera (scale 0.4) · tay gần (scale 2.2) · chặn bỏ bước · chặn sai thứ tự · hết hạn ấn 1 · mất dấu tay không kẹt trạng thái · nạp lại chuỗi sau khi bắn.

**Hình ảnh:** `screenshots/` chụp từ Chrome headless (SwiftShader, WebGL2) ở 5 mốc: `idle`, `armed`, `charged`, bay 34%, bay 68% (có vòng xung kích).

## Giới hạn đã biết

- **Chưa test bằng webcam thật** trong môi trường này — logic phân loại đã test bằng landmark tổng hợp, nhưng ngưỡng `pinchGap < 0.5`, `tipD > pipD * 1.12` cần canh lại khi dùng tay thật. Đây là việc đầu tiên cần làm khi có người ngồi trước camera.
- Chưa có âm thanh; chưa có hậu kỳ mép màn hình (chromatic aberration).
- Quả cầu bay theo hướng cố định (`FLIGHT_DIR`), chưa bắn về phía bàn tay người dùng chỉ.
- Khối "Tử" lúc bay vẫn còn hơi trắng ở lõi so với sắc tím chuẩn của anime; đã giảm bằng viền tím (`uRim`) nhưng cần thêm một vòng tinh chỉnh nếu muốn khớp màu.

## Tệp

| Tệp | Vai trò |
|---|---|
| `index.html` | khung trang, HUD, importmap CDN |
| `main.mjs` | Three.js scene, shader quả cầu, máy trạng thái hiệu ứng, vòng lặp MediaPipe |
| `gestures.mjs` | phân loại ấn tay + máy trạng thái 3 bước (thuần JS, test được bằng Node) |
| `gestures.test.mjs` | 12 test |
| `screenshots/` | ảnh kiểm chứng 5 mốc |
