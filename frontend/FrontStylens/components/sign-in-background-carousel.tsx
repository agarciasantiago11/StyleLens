import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';

type SignInBackgroundCarouselProps = {
  images: ImageSource[];
};

const CARD_WIDTH = 220;
const CARD_HEIGHT = 320;
const CARD_GAP = 16;

export function SignInBackgroundCarousel({ images }: SignInBackgroundCarouselProps) {
  const offset = useSharedValue(0);
  const { width } = useWindowDimensions();

  // Triplicamos para que haya material visual suficiente en el loop sin cortes visibles.
  const slides = useMemo(() => {
    if (images.length === 0) return [];
    return [...images, ...images, ...images];
  }, [images]);

  useEffect(() => {
    if (images.length === 0) return;

    const trackWidth = images.length * (CARD_WIDTH + CARD_GAP);
    const duration = Math.max(18000, images.length * 4800);

    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-trackWidth, { duration, easing: Easing.linear }),
      -1,   // infinito
      false // sin reversa
    );

    return () => {
      cancelAnimation(offset);
    };
  }, [images, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (slides.length === 0) {
    return <View style={styles.emptyBackground} pointerEvents="none" />;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.track,
          {
            width: slides.length * (CARD_WIDTH + CARD_GAP),
            paddingHorizontal: Math.max(24, width * 0.08),
          },
          animatedStyle,
        ]}
      >
        {slides.map((image, index) => (
          <View key={`${index}`} style={styles.card}>
            <Image source={image} style={styles.image} contentFit="cover" transition={500} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  emptyBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '-4deg' }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
});