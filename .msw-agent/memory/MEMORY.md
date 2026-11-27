# Memory — Project `td-grad-invitation`

## Index

| Chủ đề | Tệp | Trạng thái |
|---|---|---|
| Nghiên cứu Vô Hạ Hạn (Gojo / JJK): cơ chế, ấn tay, chú ngữ, chương–tập gốc | `gojo-limitless/README.md` | ✅ đã đối chiếu wiki + chương truyện |
| Bộ ảnh minh hoạ 7 chiêu (SVG, 1200×675) | `gojo-limitless/img/` · xem `gojo-limitless/index.html` | ✅ đã render & tự kiểm tra bằng mắt |
| Danh sách repo/demo source hiệu ứng Gojo (Three.js, MediaPipe, Unity, Minecraft…) | `gojo-limitless/sources.md` | ✅ link đã kiểm tra qua GitHub API |
| Nhật ký làm việc | `2026-11-27.md` | — |

## Quy ước đang dùng

- Nhánh làm việc cho nghiên cứu này: `research/gojo-limitless-vfx`. **Không làm trên `main`.**
- Ảnh minh hoạ sinh bằng SVG viết tay (không dùng ảnh có bản quyền của MAPPA/JJK), render kiểm tra bằng `google-chrome --headless --screenshot`.
- Mọi khẳng định về chiêu thức trong `gojo-limitless/README.md` đều kèm số chương/tập; chỗ nào chỉ là suy đoán của fan thì ghi rõ `[fan]`.

## Bối cảnh dự án liên quan

- `specs/002-gesture-invitation/spec.md`: thiệp mời tốt nghiệp tương tác bằng cử chỉ tay, dùng Hand Landmarker 21 điểm, có cảnh ném cầu lửa thiêu phong thư → cùng họ kỹ thuật với các demo Gojo dùng MediaPipe + Three.js.
- Web app: `web/` (React + Three.js), shader GLSL ở `td/shaders/`.
