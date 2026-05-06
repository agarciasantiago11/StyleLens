Coloca aqui las fotografias del fondo del sign-in.

Pasos:
1. Añade imagenes .jpg o .png en esta carpeta.
2. Registra cada imagen en frontend/FrontStylens/constants/sign-in-carousel-images.ts.

Ejemplo:

import { ImageSource } from 'expo-image';

export const SIGN_IN_CAROUSEL_IMAGES: ImageSource[] = [
  require('@/assets/images/sign-in-carousel/look-01.jpg'),
  require('@/assets/images/sign-in-carousel/look-02.jpg'),
  require('@/assets/images/sign-in-carousel/look-03.jpg'),
];