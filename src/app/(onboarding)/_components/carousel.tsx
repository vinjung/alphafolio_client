'use client';
import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { Text } from '@/components/shared/text';
import { cx } from '@/lib/utils/cva.config';
import Image from 'next/image';

import 'swiper/css';
import 'swiper/css/pagination';

const slides = [
  {
    image: '/images/slide-1.webp',
    fallback: '/images/slide-1.png',
    width: 300,
    height: 224,
    title: (
      <Text variant="t1">
        투자금의 크기가
        <br />
        가능성의 크기가 되지 않도록
      </Text>
    ),
    desc: (
      <>
        <Text variant="b1">
          개인에게도, 시장을 앞지르는 &lsquo;포트폴리오&rsquo;를!
        </Text>
      </>
    ),
  },
  {
    image: '/images/slide-2.webp',
    fallback: '/images/slide-2.png',
    width: 300,
    height: 224,
    title: (
      <Text variant="t1">
        확신 없는 투자가
        <br />
        가장 외로운 법이니까
      </Text>
    ),
    desc: (
      <>
        <Text variant="b1">
          24시간 당신의 근거가 되어줄 AI 비서.
        </Text>
      </>
    ),
  },
];

export default function OnboardingCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
  };

  const handleClick = () => {
    if (swiperRef.current) {
      // 마지막 슬라이드면 처음으로, 아니면 다음으로
      if (swiperRef.current.activeIndex >= slides.length - 1) {
        swiperRef.current.slideTo(0);
      } else {
        swiperRef.current.slideNext();
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center">
      <Swiper
        modules={[Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        onSlideChange={handleSlideChange}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="w-full cursor-pointer"
        onClick={handleClick}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="h-84 relative w-full flex justify-center">
              <Image
                src={slide.image}
                alt={`slide-${index + 1}`}
                fill
                className="object-contain"
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                draggable={false}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 인디케이터 */}
      <div className="mt-12 mb-4 flex gap-2 items-center">
        {slides.map((_, i) => (
          <div
            key={i}
            className={cx(
              'h-2 rounded-full transition-all duration-300',
              i === activeIndex ? 'w-7 bg-red-900' : 'w-2 bg-red-80'
            )}
          />
        ))}
      </div>

      {/* 텍스트 - 고정 높이로 슬라이드 간 이미지 위치 일치 */}
      <div className="flex flex-col items-center mt-4 gap-2 min-h-[200px]">
        <div className="text-xl font-extrabold text-[#FAFAFA] mb-2 text-center">
          {slides[activeIndex].title}
        </div>
        <div className="text-base text-[#FAFAFA] text-center leading-snug">
          {slides[activeIndex].desc}
        </div>
      </div>
    </div>
  );
}
