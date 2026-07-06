// Menu data dengan kategori
export const menuData = {
  makanan: [
    {
      id: 1,
      name: 'Mie Setan Iblis',
      price: 15000,
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500',
      hasLevel: true,
      description: 'Mie goreng yang pedas dengan bumbu rahasia'
    },
    {
      id: 2,
      name: 'Mie Goreng Special',
      price: 17000,
      image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
      hasLevel: true,
      description: 'Mie goreng spesial dengan telur dan sayuran'
    },
    {
      id: 3,
      name: 'Dimsum Ayam',
      price: 12000,
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500',
      hasLevel: false,
      description: 'Dimsum ayam kukus empuk'
    },
    {
      id: 4,
      name: 'Nasi Goreng Kampung',
      price: 13000,
      image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
      hasLevel: true,
      description: 'Nasi goreng dengan kampuran telur dan kacang'
    },
    {
      id: 5,
      name: 'Nasi Goreng khas jawa',
      price: 30000,
      image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
      hasLevel: true,
      description: 'Nasi goreng dengan campuran telur'
    },
  ],
  minuman: [
    {
      id: 101,
      name: 'Es Genderuwo',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
      hasLevel: false,
      description: 'Es campur istimewa'
    },
    {
      id: 102,
      name: 'Es Teh Manis',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500',
      hasLevel: false,
      description: 'Teh dingin yang segar'
    },
    {
      id: 103,
      name: 'Jus Jeruk',
      price: 7000,
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500',
      hasLevel: false,
      description: 'Jus jeruk segar'
    },
  ],
  snack: [
    {
      id: 201,
      name: 'Gorengan Tahu',
      price: 4000,
      image: 'https://images.unsplash.com/photo-1562689033-039adc142d2f?w=500',
      hasLevel: false,
      description: 'Tahu goreng crispy'
    },
    {
      id: 202,
      name: 'Lumpia',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1562249885-8aa1fb98c835?w=500',
      hasLevel: false,
      description: 'Lumpia goreng renyah'
    },
    {
      id: 203,
      name: 'Bakso Goreng',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1605521209206-a5c21d33cf9c?w=500',
      hasLevel: false,
      description: 'Bakso goreng kenyal'
    },
  ]
};

export const spiceLevels = Array.from({ length: 8 }, (_, i) => i + 1);
