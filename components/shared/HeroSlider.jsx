import React from 'react';
// Import komponen dan style dari Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

// Anda bisa mengganti data ini dengan gambar dari API atau state management
const slides = [
  { id: 1, imageUrl: '/tes slider.png', alt: 'Menu Andalan' },
  { id: 2, imageUrl: '/tes slider.png', alt: 'Promo Spesial' },
  { id: 3, imageUrl: '/tes slider.png', alt: 'Diskon Akhir Pekan' },
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