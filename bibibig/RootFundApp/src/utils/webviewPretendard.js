import { Platform } from 'react-native';

/**
 * WebView HTML에서 Pretendard를 강제로 쓰기 위한 CSS
 * - iOS: Info.plist에 폰트가 등록되어 있어 font-family만 지정해도 적용되는 경우가 많음
 * - Android WebView: assets 폰트를 CSS에서 직접 로드해야 해서 file:///android_asset 경로로 @font-face를 추가
 */
export function getWebViewPretendardCss() {
  if (Platform.OS === 'android') {
    return `
      @font-face {
        font-family: 'Pretendard-Regular';
        src: url('file:///android_asset/fonts/Pretendard-Regular.otf');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Pretendard-Medium';
        src: url('file:///android_asset/fonts/Pretendard-Medium.otf');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'Pretendard-SemiBold';
        src: url('file:///android_asset/fonts/Pretendard-SemiBold.otf');
        font-weight: 600;
        font-style: normal;
      }
      @font-face {
        font-family: 'Pretendard-Bold';
        src: url('file:///android_asset/fonts/Pretendard-Bold.otf');
        font-weight: 700;
        font-style: normal;
      }

      html, body, * {
        font-family: 'Pretendard-Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
    `;
  }

  return `
    html, body, * {
      font-family: 'Pretendard-Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
  `;
}


