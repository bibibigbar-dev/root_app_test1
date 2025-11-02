#!/bin/bash

# App Icon 생성 스크립트
# Python의 PIL/Pillow를 사용하여 기본 앱 아이콘 생성

ICON_DIR="ios/RootFundApp/Images.xcassets/AppIcon.appiconset"
PYTHON_SCRIPT="scripts/create_icon.py"

# Python 스크립트로 아이콘 생성
python3 << 'EOF'
from PIL import Image, ImageDraw, ImageFont
import os

icon_dir = "ios/RootFundApp/Images.xcassets/AppIcon.appiconset"
os.makedirs(icon_dir, exist_ok=True)

# 아이콘 크기 목록
sizes = [
    (40, "Icon-App-20x20@2x.png"),      # 20pt @2x
    (60, "Icon-App-20x20@3x.png"),      # 20pt @3x
    (58, "Icon-App-29x29@2x.png"),      # 29pt @2x
    (87, "Icon-App-29x29@3x.png"),      # 29pt @3x
    (80, "Icon-App-40x40@2x.png"),      # 40pt @2x
    (120, "Icon-App-40x40@3x.png"),     # 40pt @3x (필수!)
    (120, "Icon-App-60x60@2x.png"),     # 60pt @2x (필수!)
    (180, "Icon-App-60x60@3x.png"),     # 60pt @3x
    (1024, "Icon-App-1024x1024.png")    # App Store 아이콘
]

for size, filename in sizes:
    # 파란색 배경에 "R" 문자를 가진 간단한 아이콘 생성
    img = Image.new('RGB', (size, size), color='#007AFF')
    draw = ImageDraw.Draw(img)
    
    # 텍스트 추가 (가능한 경우)
    try:
        # 시스템 폰트 사용
        font_size = int(size * 0.6)
        # 간단한 원 대신 사용
        margin = size // 10
        draw.ellipse([margin, margin, size-margin, size-margin], 
                    fill='white', outline='white', width=2)
    except:
        pass
    
    filepath = os.path.join(icon_dir, filename)
    img.save(filepath, 'PNG')
    print(f"✅ Created: {filename} ({size}x{size})")

print("\n🎉 All app icons generated successfully!")
print("⚠️  Note: These are placeholder icons. Replace with your actual app icon design.")
EOF

echo ""
echo "✅ 아이콘 생성 완료!"
echo "⚠️  참고: 이것은 임시 아이콘입니다. 실제 앱 아이콘 디자인으로 교체해주세요."

