# 🎨 Hướng dẫn thay đổi màu sắc Wordsly

## Màu sắc chủ đạo

Tất cả màu sắc của ứng dụng được quản lý tập trung tại file `app/globals.css`.

### Cách thay đổi màu chính

Mở file `app/globals.css` và tìm đến phần `:root` (dòng 50). Bạn sẽ thấy các biến màu chính (theme hiện tại là **Aurora** — tím điện quang với điểm nhấn cyan và cam san hô):

```css
:root {
  /* Wordsly — Aurora: electric violet hero, cyan + coral accents */
  --brand-primary: oklch(0.58 0.235 295); /* Màu tím chính */
  --brand-secondary: oklch(0.7 0.15 215); /* Màu cyan phụ */
  --brand-accent: oklch(0.7 0.19 40); /* Màu cam san hô nhấn */
  ...
}
```

**Lưu ý khi đổi `--brand-primary`**: đổi kèm `--primary-shadow` (bóng 3D của nút, nên tối hơn primary ~0.12 Lightness) và kiểm tra `--primary-foreground` còn đủ tương phản (primary tối → chữ trắng, primary sáng → chữ tối).

### Cú pháp màu OKLCH

Format: `oklch(Lightness Chroma Hue)`

- **Lightness (L)**: 0-1 (0 = đen, 1 = trắng)
- **Chroma (C)**: 0-0.4 (độ bão hòa màu)
- **Hue (H)**: 0-360 (góc màu)
  - 0° = Đỏ
  - 60° = Vàng
  - 120° = Xanh lá
  - 180° = Xanh dương nhạt (Cyan)
  - 240° = Xanh dương
  - 270° = Tím
  - 300° = Hồng tím (Magenta)
  - 360° = Đỏ

### Ví dụ các bảng màu phổ biến

#### 1. Màu xanh lá (Green Theme — theme cũ của Wordsly)

```css
--brand-primary: oklch(0.72 0.2 142);
--brand-secondary: oklch(0.62 0.17 230);
--brand-accent: oklch(0.7 0.2 50);
```

#### 2. Màu cam (Orange Theme)
```css
--brand-primary: oklch(0.65 0.22 40);
--brand-secondary: oklch(0.7 0.2 50);
--brand-accent: oklch(0.75 0.18 30);
```

#### 3. Màu xanh dương (Blue Theme)
```css
--brand-primary: oklch(0.55 0.22 240);
--brand-secondary: oklch(0.6 0.2 220);
--brand-accent: oklch(0.65 0.18 260);
```

#### 4. Màu hồng (Pink Theme)
```css
--brand-primary: oklch(0.65 0.22 340);
--brand-secondary: oklch(0.7 0.2 320);
--brand-accent: oklch(0.75 0.18 350);
```

#### 5. Màu đỏ (Red Theme)
```css
--brand-primary: oklch(0.6 0.24 20);
--brand-secondary: oklch(0.65 0.22 10);
--brand-accent: oklch(0.7 0.2 30);
```

### Dark Mode

Nhớ thay đổi cả phần `.dark` (khoảng dòng 105) để màu dark mode khớp với light mode:

```css
.dark {
  /* Wordsly Brand Colors - Dark Mode */
  --brand-primary: oklch(0.72 0.19 295);  /* Tăng Lightness cho dark mode */
  --brand-secondary: oklch(0.78 0.13 215);
  --brand-accent: oklch(0.78 0.17 45);
  ...
}
```

**Lưu ý**: Với dark mode, thường tăng giá trị Lightness lên 0.1-0.15 so với light mode để màu sáng hơn và dễ nhìn trên nền tối.

### Áp dụng thay đổi

Sau khi sửa file `globals.css`, màu sắc sẽ tự động cập nhật trên toàn bộ ứng dụng vì tất cả components đều sử dụng CSS variables này.

### Các nơi sử dụng brand colors:

- Buttons (primary variant)
- Links và text accents
- Gradients trong UI
- Focus rings và borders khi tương tác
- Charts và visualizations
- Sidebar và navigation

## 🛠️ Tools hữu ích

- [OKLCH Color Picker](https://oklch.com/) - Công cụ chọn màu OKLCH trực quan
- [Colorffy](https://colorffy.com/) - Tạo bảng màu OKLCH
