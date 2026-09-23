import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

const slides = [
  { id: 1, imageUrl: '/slider/menu.jpeg', alt: 'Menu Andalan' },
  { id: 2, imageUrl: '/slider/promo.jpeg', alt: 'Promo Spesial' },
  { id: 3, imageUrl: '/slider/special menu.jpeg', alt: 'menu spesial' },
];

export default function HeroSlider() {
  return (
    <div className="w-full px-4 my-4">
      <Swiper
        modules={[Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        className="rounded-xl"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <img
              src={slide.imageUrl}
              alt={slide.alt}
              className="w-full h-36 md:h-40 object-cover rounded-xl"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}