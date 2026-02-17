import '../styles/globals.css';
import { pretendard, recipekorea } from '@/styles/fonts';
import { SplashScreen } from '@/components/splash-screen';
import { CountryFlagPolyfill } from '@/components/country-flag-polyfill';
import type { Metadata, Viewport } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';

// ✅ viewport 설정을 별도로 export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dducksang.com';
  const ogTitle = '떡상 - 투자금의 크기가 가능성의 크기가 되지 않도록\uD83D\uDE80';
  const ogDescription = "개인에게도, 시장을 앞지르는 '포트폴리오'를!";

  return {
    title: {
      default: '떡상 - AI 주식 정보 서비스',
      template: '%s | 떡상',
    },
    description: ogDescription,
    keywords: ['주식', '투자', 'AI', '떡상', '주식정보', '급등주'],
    metadataBase: new URL(siteUrl),
    verification: {
      google: 'Cy7EcmVN30X847MUoZAv4IhPG05kfwl0QyLas1LWp1g',
    },
    other: {
      'naver-site-verification': 'c2d15e6a4204fb78ec6371ca62ef14f4a58d5602',
    },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: siteUrl,
      title: ogTitle,
      description: ogDescription,
      siteName: '떡상',
      images: [
        {
          url: '/og-image-3.jpg',
          width: 1200,
          height: 630,
          alt: '떡상 - AI 주식 정보 서비스',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ['/og-image-3.jpg'],
    },
    // ✅ 검색엔진 크롤링 설정
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${recipekorea.variable}`}
    >
      <body className="overflow-hidden">
        {/* 🇰🇷 국가 이모지 폴리필 - npm 패키지 방식 */}
        <CountryFlagPolyfill />

        {/* 🎯 PC에서 모바일 크기 제한을 위한 래퍼 */}
        <div className="h-dvh flex justify-center overflow-hidden">
          <div
            id="mobile-container"
            className="mobile-container w-full max-w-[428px] bg-neutral-0 h-dvh flex flex-col relative overflow-hidden font-pretendard pt-safe-top"
            style={{ position: 'relative' }} // 🎯 명시적 relative positioning 추가
          >
            <SplashScreen />
            {children}
          </div>
        </div>
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
    </html>
  );
}
