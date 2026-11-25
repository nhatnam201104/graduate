# TouchDesigner 3D Graduation Invitation (`td-grad-invitation`)

Thiệp mời tốt nghiệp **3D đa chiều tương tác trên máy tính (Desktop-Only)** theo kiến trúc **Hybrid TouchDesigner + WebGL2 (React Three Fiber)**, trong đó **khuôn mặt của từng khách mời** đóng vai trò kép (**Dual Face-Key**):

1. **Identity Key (Face Match 1:N)**: Nhận diện khách mời qua 1 đường dẫn chung duy nhất (ví dụ `https://grad.nnamtech.dev`) và giải khóa đúng lời chúc cá nhân + ảnh kỷ niệm chung.
2. **Visual DNA Seed**: Sinh mã hình học, bảng màu, shader và chuyển động 3D tất định — độc bản cho từng người nhưng nhất quán ở mọi lần mở thiệp.

## Tài liệu dự án
- [`docs/PRD.md`](docs/PRD.md) — Bản đặc tả sản phẩm, công nghệ và kiến trúc kỹ thuật đầy đủ.
- [`docs/PRD.html`](docs/PRD.html) — Bản trình bày PRD trực quan (sơ đồ Mermaid, ma trận Theme Lab, kiến trúc Dual Face-Key & lộ trình triển khai).

## Cấu trúc thư mục (Git-Native)
```text
td-grad-invitation/
├── docs/          # PRD.md, PRD.html và tài liệu kỹ thuật
├── td/            # TouchDesigner externalized scripts, GLSL shaders, JSON presets, .tox
├── face-key/      # Engine sinh FaceDNA tất định & công cụ kiểm thử sinh trắc học
├── server/        # FastAPI backend (YuNet + SFace + MiniFASNet + AES-256-GCM + SQLite WAL)
└── web/           # React + TypeScript + Vite + Three.js (R3F/Drei/Postprocessing/GLSL3)
```
# graduate
