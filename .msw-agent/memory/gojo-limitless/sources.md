# Source code hiệu ứng Gojo — đã kiểm tra 2026-11-27

Tất cả repo dưới đây đã được gọi GitHub API để xác nhận còn tồn tại; số sao là tại thời điểm kiểm tra.
**Chưa clone repo nào.** Trước khi dùng code phải đọc LICENSE từng repo — phần lớn repo nhỏ **không có license** (mặc định là giữ toàn bộ bản quyền).

## Web + cử chỉ tay (Three.js / MediaPipe) — hợp nhất với dự án này

| Repo | ⭐ | Có gì | Demo |
|---|---|---|---|
| `reinesana/SAT0RU` | 317 | Blue, Red, Hollow Purple, Infinite Void; particle nhiều lớp | – |
| `m0Corut/jjk-limitless-ar` | 4 | Red → Blue → hợp nhất → Hollow Purple, AR | m0corut.github.io/jjk-limitless-ar |
| `Rayhan-099/hand-tracking-visualizer` | 3 | Hollow Purple (hút + đẩy), Infinite Void | jujutsu-kaisen-rho.vercel.app |
| `zuck30/RYOIKI-TENKAI` | 3 | nhiều chiêu JJK, cử chỉ + giọng nói | jjkdomain.netlify.app |
| `montasirmoyen/domain-expansion` | 5 | nhận diện ấn tay lãnh địa + overlay | domain-expansion-jjk.vercel.app |
| `moonkhight1002/jujutsu-kaisen-handsigns-visualizer-` | 0 | Hollow Purple + chiêu Sukuna, audio thủ tục | – |
| `zkzkGamal/Hollow-Purple-AR-…` | 2 | Purple bám đầu ngón tay | – |
| `Sai-Varun-M/Gojo` | 2 | particle cho các chiêu Gojo | – |
| `Mrez2/GOJO-JJK-Powers` | 1 | Hollow Purple điện ảnh | – |
| `collidingScopes/threejs-handtracking-101` | 188 | **khung nền** Three.js + MediaPipe (không phải Gojo) | collidingscopes.github.io/threejs-handtracking-101 |
| Bài viết `aurelius.day/projects/domain-expansion` | – | giải thích cách làm hand tracking + shader cho Purple | – |

## Web chỉ có hiệu ứng (không webcam)

| Repo | ⭐ | Demo |
|---|---|---|
| `VITNT/Gojo-Technique` | 1 | gojo-technique.vercel.app |
| `P09s/infiniteVoid` | 1 | infinite-void.vercel.app |
| `Sowndhar-2005/the-Honored-One` | 1 | the-honored-one.netlify.app (Unlimited Void bằng CSS) |
| `Gitodear/Hollow-Purple` | 1 | hollow-purple-tau.vercel.app |

## Python + OpenCV / MediaPipe

- `Namkar255/Gojo-Hollow-Purple` — plasma thủ tục, bắn cầu, nổ.
- `YusufZiyaeddinFurtana/gojo-hand-techniques` — Red, Blue, Purple, Unlimited Void, mắt xanh.
- `Badrinath-05/Hollow_Purple`, `rishi01811/hollow-purple`.
- `Mahima07-mai/jjk-domain-expansion-HandGesture-OpenCV`, `WWIIITT/Jujutsu-Kaisen-Domain-Expansion` (Random Forest cho ấn tay).
- `Kosmo20177/Hollow-purple-animation-manim` — Manim.

## Game engine / mod

- `schnellerzug/Infinity-Remaster` — Unity ShaderLab, mô phỏng Infinity.
- `NguyenDevs/GojoInfinity` — plugin Minecraft (Hollow Purple + Infinity), có trên SpigotMC.
- `rustybear0/More-hollow-purple` — Roblox.
- Blade & Sorcery “Limitless Technique” trên mod.io — Red, Blue, Purple, domain.
- Gumroad `starkim1999` “Unlimited Hollow Purple” — animation VRChat, **trả phí**.

## Đã tìm nhưng KHÔNG có

- **Shadertoy**: không có shader nào mang tên Gojo / Hollow Purple / Unlimited Void.
- **CodePen**: chỉ có trang giới thiệu nhân vật và carousel ảnh, không có hiệu ứng chiêu thức.
- **TouchDesigner**: chỉ có video TikTok/Instagram (ví dụ `@vyndetta__`), **không kèm file `.toe`**.

## Khoảng trống cần tự làm

Không repo nào làm đúng **Vô Hạn** (vật thể khựng lại + méo không gian, không có khiên sáng) và **Vô Lượng Không Xứ** theo mô tả wiki (hố đen + thiên hà + dòng thông tin chảy vào đầu mục tiêu). Đây là hai phần phải tự dựng shader.
