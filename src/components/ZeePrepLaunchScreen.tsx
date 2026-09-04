import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from "react-native";
import { createAudioPlayer } from "expo-audio";
import * as SecureStore from "expo-secure-store";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Polygon,
} from "react-native-svg";

const { width } = Dimensions.get("window");
const LAST_LAUNCH_KEY = "zeeprep_last_launch_anim_time";
const MIN_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours minimum between splash animations

// In-memory cold launch state (resets only on process exit)
let hasPlayedColdLaunch = false;

interface ZeePrepLaunchScreenProps {
  onComplete: () => void;
}

export function ZeePrepLaunchScreen({ onComplete }: ZeePrepLaunchScreenProps) {
  const [isDone, setIsDone] = useState(false);

  // Animation values
  const bgGlowScale = useRef(new Animated.Value(0.6)).current;
  const bgGlowOpacity = useRef(new Animated.Value(0.1)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateY = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Audio references
  const musicPlayerRef = useRef<any>(null);
  const voicePlayerRef = useRef<any>(null);

  useEffect(() => {
    // If Web platform or already played in this process, skip immediately
    if (Platform.OS === "web" || hasPlayedColdLaunch) {
      onComplete();
      return;
    }

    let isMounted = true;
    let fadeOutStarted = false;
    let voiceHasStarted = false;
    let musicHasStarted = false;
    let voiceDone = false;
    let musicDone = false;

    const cleanupAudio = () => {
      try {
        if (musicPlayerRef.current) {
          musicPlayerRef.current.pause();
          musicPlayerRef.current.remove();
          musicPlayerRef.current = null;
        }
        if (voicePlayerRef.current) {
          voicePlayerRef.current.pause();
          voicePlayerRef.current.remove();
          voicePlayerRef.current = null;
        }
      } catch (e) {
        // Ignored
      }
    };

    const finishLaunchSequence = () => {
      if (fadeOutStarted || !isMounted) return;
      fadeOutStarted = true;

      // Smoothly fade screen
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted) return;
        cleanupAudio();
        setIsDone(true);
        onComplete();
      });
    };

    const startLaunchSequence = () => {
      hasPlayedColdLaunch = true;

      // Step 1: Start Visual Animation
      Animated.parallel([
        Animated.timing(bgGlowScale, {
          toValue: 1.25,
          duration: 1600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bgGlowOpacity, {
          toValue: 0.45,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1.0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkOpacity, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1.0,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Step 2: Initialize Audio & Monitor Dual Audio Completion
      try {
        const musicSource = require("../../assets/Intro Music 1.mp3");
        const voiceSource = require("../../assets/Intro.mp3");

        const musicPlayer = createAudioPlayer(musicSource);
        const voicePlayer = createAudioPlayer(voiceSource);

        musicPlayerRef.current = musicPlayer;
        voicePlayerRef.current = voicePlayer;

        // 0.15s: Start Intro Voice sound
        setTimeout(() => {
          if (!isMounted) return;
          try {
            voicePlayer.volume = 1.0;
            voicePlayer.play();
            voiceHasStarted = true;
          } catch (e) {
            console.warn("Voice play notice:", e);
          }
        }, 150);

        // 0.8s: Start Intro Music
        setTimeout(() => {
          if (!isMounted) return;
          try {
            musicPlayer.volume = 0.125;
            musicPlayer.play();
            musicHasStarted = true;
          } catch (e) {
            console.warn("Music play notice:", e);
          }
        }, 800);

        // Dual Audio Poller
        const pollInterval = setInterval(() => {
          if (!isMounted) {
            clearInterval(pollInterval);
            return;
          }

          try {
            if (voicePlayer && voiceHasStarted) {
              const vPlaying = Boolean(voicePlayer.playing);
              const vCur = voicePlayer.currentTime || 0;
              const vDur = voicePlayer.duration || 0;
              if (!vPlaying || (vDur > 0 && vCur >= vDur - 0.2)) {
                voiceDone = true;
              }
            }

            if (musicPlayer && musicHasStarted) {
              const mPlaying = Boolean(musicPlayer.playing);
              const mCur = musicPlayer.currentTime || 0;
              const mDur = musicPlayer.duration || 0;
              if (!mPlaying || (mDur > 0 && mCur >= mDur - 0.2)) {
                musicDone = true;
              }
            }

            if (voiceDone && musicDone) {
              clearInterval(pollInterval);
              setTimeout(() => {
                if (isMounted) finishLaunchSequence();
              }, 400);
            }
          } catch (e) {
            // Ignored
          }
        }, 150);

        // Safety max timeout (9.5s)
        setTimeout(() => {
          if (isMounted && !fadeOutStarted) {
            finishLaunchSequence();
          }
        }, 9500);
      } catch (err) {
        console.warn("Launch audio setup notice:", err);
        setTimeout(() => {
          if (isMounted && !fadeOutStarted) {
            finishLaunchSequence();
          }
        }, 4500);
      }
    };

    // Check last launch timestamp
    const checkLaunchEligibility = async () => {
      try {
        let lastTsStr: string | null = null;
        if (Platform.OS === "web") {
          lastTsStr = localStorage.getItem(LAST_LAUNCH_KEY);
        } else {
          lastTsStr = await SecureStore.getItemAsync(LAST_LAUNCH_KEY);
        }

        const now = Date.now();
        if (lastTsStr && now - Number(lastTsStr) < MIN_INTERVAL_MS) {
          // Opened recently — skip intro animation and audio
          hasPlayedColdLaunch = true;
          onComplete();
          return;
        }

        // Save current timestamp
        if (Platform.OS === "web") {
          localStorage.setItem(LAST_LAUNCH_KEY, String(now));
        } else {
          await SecureStore.setItemAsync(LAST_LAUNCH_KEY, String(now));
        }
      } catch (e) {
        // Fall through to play animation if storage fails
      }

      if (!isMounted) return;
      startLaunchSequence();
    };

    checkLaunchEligibility();

    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, []);

  if (isDone) return null;

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Radial Light Ambient Glow */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            transform: [{ scale: bgGlowScale }],
            opacity: bgGlowOpacity,
          },
        ]}
      />

      <View style={styles.brandLockupContainer}>
        {/* Logo Badge with Distinctive Z Symbol */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Svg viewBox="0 0 512 512" style={styles.logoSvg}>
            <Defs>
              <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#4F46E5" />
                <Stop offset="50%" stopColor="#4338CA" />
                <Stop offset="100%" stopColor="#3730A3" />
              </LinearGradient>
              <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FBBF24" />
                <Stop offset="50%" stopColor="#F59E0B" />
                <Stop offset="100%" stopColor="#D97706" />
              </LinearGradient>
              <LinearGradient id="accentSpark" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="#E0E7FF" />
              </LinearGradient>
            </Defs>

            {/* Background Badge Shield */}
            <Rect x="32" y="32" width="448" height="448" rx="112" fill="url(#bgGrad)" />
            <Rect
              x="40"
              y="40"
              width="432"
              height="432"
              rx="104"
              fill="none"
              stroke="#818CF8"
              strokeWidth="10"
              strokeOpacity={0.4}
            />

            {/* Academic Cap Roof */}
            <Polygon points="256,112 400,184 256,256 112,184" fill="url(#goldGrad)" />

            {/* Cap Base */}
            <Path
              d="M168,218 L168,280 C168,320 206,344 256,344 C306,344 344,320 344,280 L344,218 L256,262 Z"
              fill="#FFFFFF"
              fillOpacity={0.95}
            />

            {/* Bold Zee "Z" Ribbon */}
            <Path
              d="M200,168 L312,168 L224,248 L312,248"
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Golden Academic Distinction Seal */}
            <Circle cx="392" cy="144" r="22" fill="url(#zpGold)" />
            <Circle cx="392" cy="144" r="16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity={0.8} />
            <Path d="M386 144 L390 148 L398 140" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>

        {/* Wordmark: "ZeePrep" */}
        <Animated.View
          style={[
            styles.wordmarkContainer,
            {
              opacity: wordmarkOpacity,
              transform: [{ translateY: wordmarkTranslateY }],
            },
          ]}
        >
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitleZee}>Zee</Text>
            <Text style={styles.brandTitlePrep}>Prep</Text>
          </View>
        </Animated.View>

        {/* Tagline: "SMART LMS PLATFORM" */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTagline}>SMART LMS PLATFORM</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCircle: {
    position: "absolute",
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: (width * 1.3) / 2,
    backgroundColor: "#EEF2FF",
    opacity: 0.6,
  },
  brandLockupContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: 140,
    height: 140,
    marginBottom: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoSvg: {
    width: "100%",
    height: "100%",
  },
  wordmarkContainer: {
    marginBottom: 8,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  brandTitleZee: {
    fontSize: 44,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: -1,
  },
  brandTitlePrep: {
    fontSize: 44,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  taglineContainer: {
    alignItems: "center",
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 4,
  },
});
