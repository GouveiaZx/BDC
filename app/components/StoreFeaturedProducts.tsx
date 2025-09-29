'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Store, Ad } from '../models/types';
import { formatCurrency } from '../utils/formatters';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface StoreFeaturedProductsProps {
  store: Store;
}

export default function StoreFeaturedProducts({ store }: StoreFeaturedProductsProps) {
  const featuredProducts = store.products.filter((ad: Ad) => ad.featured);

  if (!featuredProducts.length) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Produtos em Destaque</h2>
      
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          768: {
            slidesPerView: 3,
          },
          1024: {
            slidesPerView: 4,
          },
        }}
        className="pb-10"
      >
        {featuredProducts.map((ad: Ad) => (
          <SwiperSlide key={ad.id}>
            <Link href={`/anuncio/${ad.id}`}>
              <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden bg-gray-200">
                  <Image
                    src={(() => {
                      // Priorizar primary_photo se existir
                      if (ad.primary_photo) {
                        return ad.primary_photo;
                      }
                      
                      // Usar photos se existir, ordenado por sort_order
                      if (ad.photos && ad.photos.length > 0) {
                        const sortedPhotos = ad.photos.sort((a, b) => a.sort_order - b.sort_order);
                        return sortedPhotos[0].file_url;
                      }
                      
                      // Fallback para images array
                      if (ad.images && ad.images.length > 0) {
                        return ad.images[0];
                      }
                      
                      return '/images/placeholder.png';
                    })()}
                    alt={ad.title}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-base font-medium text-gray-900 truncate">{ad.title}</h3>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(ad.price)}
                    </p>
                  </div>
                </div>
                
                {ad.featured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded">
                    Destaque
                  </div>
                )}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}