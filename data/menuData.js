// Menu data dengan kategori
export const menuData = {
  makanan: [
    {
      id: 1,
      name: 'Mie Setan Iblis',
      price: 15000,
      image: '/menu/mie pedas.jpeg',
      hasLevel: true,
      description: 'Mie goreng yang pedas dengan bumbu rahasia'
    },
    {
      id: 2,
      name: 'Mie Goreng Special',
      price: 17000,
      image: '/menu/mie spesial.jpeg',
      hasLevel: true,
      description: 'Mie goreng spesial dengan telur dan sayuran'
    },
    {
      id: 3,
      name: 'Dimsum Ayam',
      price: 12000,
      image: '/menu/dimsum.jpeg',
      hasLevel: false,
      description: 'Dimsum ayam kukus empuk'
    },
    {
      id: 4,
      name: 'Nasi Goreng ayam Kampung',
      price: 13000,
      image: '/menu/Nasi goreng.jpeg',
      hasLevel: true,
      description: 'Nasi goreng khas jawa dengan ayam kampung' 
    },
    {
      id: 5,
      name: 'Nasi Goreng khas jawa',
      price: 30000,
      image: '/menu/nasgor jaw.jpeg',
      hasLevel: true,
      description: 'Nasi goreng dengan campuran telur khas jawa'
    },
  ],
  minuman: [
    {
      id: 101,
      name: 'Es Genderuwo',
      price: 8000,
      image: '/menu/es gendruwo.jpeg',
      hasLevel: false,
      description: 'Es campur istimewa'
    },
    {
      id: 102,
      name: 'Es Teh Manis',
      price: 5000,
      image: '/menu/es teh.jpeg',
      hasLevel: false,
      description: 'Teh dingin yang segar'
    },
    {
      id: 103,
      name: 'Es Jeruk',
      price: 7000,
      image: '/menu/es jeruk.jpeg',
      hasLevel: false,
      description: 'Jus jeruk segar'
    },
  ],
  snack: [
    {
      id: 201,
      name: 'Tahu Crispy',
      price: 4000,
      image: '/menu/tahu goreng.jpeg',
      hasLevel: false,
      description: 'Tahu goreng crispy'
    },
    {
      id: 202,
      name: 'Lumpia',
      price: 5000,
      image: '/menu/lumpia goreng.jpeg',
      hasLevel: false,
      description: 'Lumpia goreng crispy'
    },
    {
      id: 203,
      name: 'Bakso Goreng',
      price: 6000,
      image: '/menu/bakso goreng.jpeg',
      hasLevel: false,
      description: 'Bakso goreng kenyal'
    },
  ]
};

export const spiceLevels = Array.from({ length: 8 }, (_, i) => i + 1);
