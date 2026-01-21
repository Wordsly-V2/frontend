# 🎨 Hướng dẫn thay đổi màu sắc Wordsly

## Màu sắc chủ đạo

Tất cả màu sắc của ứng dụng được quản lý tập trung tại file `app/globals.css`.

### Cách thay đổi màu chính

Mở file `app/globals.css` và tìm đến phần `:root` (dòng 49). Bạn sẽ thấy 3 biến màu chính:

```css
:root {
  /* Wordsly Brand Colors - Dễ dàng thay đổi màu chủ đạo ở đây */
  --brand-primary: oklch(0.6 0.25 270); /* Màu tím chính */
  --brand-secondary: oklch(0.65 0.22 250); /* Màu xanh tím phụ */
  --brand-accent: oklch(0.7 0.2 320); /* Màu hồng nhấn */
  ...
}
```

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

#### 1. Màu xanh lá (Green Theme)
```css
--brand-primary: oklch(0.55 0.22 140);
--brand-secondary: oklch(0.6 0.2 160);
--brand-accent: oklch(0.65 0.18 120);
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

Nhớ thay đổi cả phần `.dark` (khoảng dòng 84) để màu dark mode khớp với light mode:

```css
.dark {
  /* Wordsly Brand Colors - Dark Mode */
  --brand-primary: oklch(0.7 0.22 270);  /* Tăng Lightness cho dark mode */
  --brand-secondary: oklch(0.65 0.2 250);
  --brand-accent: oklch(0.75 0.18 320);
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
