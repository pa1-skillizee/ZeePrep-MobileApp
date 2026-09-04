import React from "react";
import { View, StyleSheet, useWindowDimensions, Platform } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Line,
  G,
} from "react-native-svg";

interface AnimatedExamIllustrationProps {
  isFormActive?: boolean;
}

export function AnimatedExamIllustration({ isFormActive = false }: AnimatedExamIllustrationProps) {
  const { width } = useWindowDimensions();

  // Dynamic responsive maxHeight scaling
  const maxIllustrationHeight = width < 360 ? 150 : width > 600 ? 340 : 220;

  // On Web, we can render pure SVG with CSS animation classes for butter-smooth 60fps movement
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { maxHeight: maxIllustrationHeight }]}>
        <svg
          viewBox="0 0 800 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%", overflow: "visible", userSelect: "none" }}
        >
          <defs>
            <linearGradient id="sandGradientWeb" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDB813" />
              <stop offset="100%" stopColor="#FFC83B" />
            </linearGradient>
            <linearGradient id="clipboardGradWeb" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
          </defs>

          {/* ================= 1. ROTATING GEARS IN BACKGROUND ================= */}
          {/* Large Gear Top Center */}
          <g className="anim-gear-large">
            <path
              d="M340 70 L346 82 A40 40 0 0 1 358 87 L371 84 L377 95 L366 104 A40 40 0 0 1 368 118 L380 123 L377 136 L363 134 A40 40 0 0 1 354 143 L358 156 L345 160 L338 148 A40 40 0 0 1 324 146 L313 154 L305 143 L315 132 A40 40 0 0 1 312 118 L299 115 L301 101 L314 102 A40 40 0 0 1 323 92 L317 79 L329 73 L338 83 A40 40 0 0 1 340 70 Z"
              fill="#E2E8F0"
            />
            <circle cx="340" cy="110" r="18" fill="#E2E8F0" />
            <circle cx="340" cy="110" r="10" fill="#F8FAFC" />
          </g>

          {/* Medium Gear Left Center */}
          <g className="anim-gear-medium">
            <path
              d="M90 290 L94 299 A30 30 0 0 1 103 303 L113 300 L117 309 L109 316 A30 30 0 0 1 110 327 L119 331 L116 340 L105 338 A30 30 0 0 1 98 345 L101 355 L91 358 L86 349 A30 30 0 0 1 76 347 L67 353 L61 344 L69 336 A30 30 0 0 1 67 325 L57 323 L59 312 L69 313 A30 30 0 0 1 76 305 L71 295 L80 291 L87 299 A30 30 0 0 1 90 290 Z"
              fill="#E2E8F0"
            />
            <circle cx="90" cy="320" r="12" fill="#F8FAFC" />
          </g>

          {/* Small Gear Right Top */}
          <g className="anim-gear-small">
            <circle cx="640" cy="170" r="22" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="6 4" fill="none" />
            <circle cx="640" cy="170" r="8" fill="#E2E8F0" />
          </g>

          {/* ================= 2. PROFESSIONAL ACADEMIC / DATA ELEMENTS ================= */}
          {/* Geometric Precision Element Top Left */}
          <g className="anim-star-green">
            <circle cx="60" cy="195" r="14" fill="#22C55E" opacity="0.15" />
            <circle cx="60" cy="195" r="7" fill="#22C55E" />
            <path d="M42 195 L78 195 M60 177 L60 213" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* Academic Credential Seal Top Middle */}
          <g className="anim-star-indigo">
            <rect x="248" y="98" width="24" height="24" rx="6" fill="#4F46E5" />
            <path d="M254 110 L258 114 L266 106" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Precision Analytics Node Right Side */}
          <g className="anim-star-orange">
            <circle cx="710" cy="282" r="12" fill="#F96D41" opacity="0.2" />
            <circle cx="710" cy="282" r="6" fill="#F96D41" />
            <circle cx="710" cy="282" r="16" stroke="#F96D41" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
          </g>

          {/* ================= 3. CLIPBOARD / TEST SHEET ================= */}
          <g id="clipboard">
            <rect x="315" y="75" width="260" height="425" rx="16" fill="#CBD5E1" opacity="0.4" />
            <rect x="310" y="70" width="260" height="420" rx="16" fill="url(#clipboardGradWeb)" stroke="#E2E8F0" strokeWidth="4" />

            {/* Orange Top Header Band */}
            <rect x="310" y="70" width="260" height="36" rx="12" fill="#F96D41" />
            {/* Dark Clip Handle */}
            <rect x="380" y="60" width="120" height="22" rx="6" fill="#22242A" />
            <rect x="390" y="66" width="100" height="10" rx="3" fill="#F96D41" />

            <circle cx="340" cy="130" r="10" fill="#E2E8F0" />
            <rect x="360" y="126" width="90" height="8" rx="4" fill="#CBD5E1" />

            {/* Checkboxes Row 1 */}
            <rect x="340" y="160" width="40" height="40" rx="8" fill="#FFC83B" />
            <path d="M350 180 L357 187 L371 171" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="395" y="172" width="130" height="8" rx="4" fill="#CBD5E1" />
            <rect x="395" y="186" width="85" height="6" rx="3" fill="#E2E8F0" />

            <rect x="470" y="160" width="40" height="40" rx="8" fill="#00B887" />
            <path d="M480 180 L487 187 L501 171" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

            <line x1="335" y1="225" x2="545" y2="225" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />

            {/* Growth Bar Chart Section */}
            <g id="chart">
              <rect x="340" y="300" width="22" height="60" rx="4" fill="#E2E8F0" />
              <rect x="372" y="270" width="22" height="90" rx="4" fill="#CBD5E1" />
              <rect x="404" y="310" width="22" height="50" rx="4" fill="#E2E8F0" />
              <rect x="436" y="250" width="22" height="110" rx="4" fill="#00B887" opacity="0.85" />
              <rect x="468" y="290" width="22" height="70" rx="4" fill="#CBD5E1" />

              <g className="anim-chart-arrow">
                <path
                  d="M400 270 L450 230 L475 242 L510 200"
                  stroke="#FFC83B"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M490 200 L510 200 L510 220" stroke="#FFC83B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>

          {/* ================= 4. GREEN CHECKMARK SPEECH BADGE ================= */}
          <g className="anim-float-badge">
            <circle cx="635" cy="115" r="40" fill="#00B887" />
            <path d="M600 135 L585 155 L615 145 Z" fill="#00B887" />
            <circle cx="635" cy="115" r="33" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.4" />
            <path
              d="M617 115 L629 127 L653 103"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ================= 5. ANIMATED HOURGLASS ================= */}
          <g id="hourglass">
            <rect x="525" y="240" width="135" height="18" rx="6" fill="#F96D41" />
            <rect x="525" y="440" width="135" height="18" rx="6" fill="#F96D41" />

            <rect x="537" y="258" width="8" height="182" rx="3" fill="#22242A" />
            <rect x="642" y="258" width="8" height="182" rx="3" fill="#22242A" />

            <path
              d="M545 258 C545 310 580 340 592 349 C605 340 640 310 640 258 Z"
              fill="#FFFFFF"
              opacity="0.6"
              stroke="#22242A"
              strokeWidth="4"
            />
            <path
              d="M545 440 C545 388 580 358 592 349 C605 358 640 388 640 440 Z"
              fill="#FFFFFF"
              opacity="0.6"
              stroke="#22242A"
              strokeWidth="4"
            />

            {/* Top Sand Draining */}
            <path
              className="anim-sand-top"
              d="M552 270 C552 310 580 335 592 345 C605 335 632 310 632 270 Z"
              fill="url(#sandGradientWeb)"
            />

            {/* Sand Stream Line */}
            <line
              className="anim-sand-line"
              x1="592"
              y1="345"
              x2="592"
              y2="425"
              stroke="#FFC83B"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Bottom Sand Filling */}
            <path
              className="anim-sand-bottom"
              d="M555 435 C565 405 585 395 592 395 C600 395 620 405 630 435 Z"
              fill="url(#sandGradientWeb)"
            />
          </g>

          {/* ================= 6. GREEN BINDER BLOCK ================= */}
          <g id="binder">
            <rect x="250" y="490" width="240" height="50" rx="8" fill="#00B887" />
            <rect x="330" y="502" width="40" height="10" rx="2" fill="#FFFFFF" />
            <rect x="330" y="518" width="40" height="10" rx="2" fill="#FFFFFF" />
          </g>

          {/* ================= 7. CHARACTER AVATAR ================= */}
          <g className={isFormActive ? "anim-character-excited" : "anim-character-idle"}>
            {/* LEGS */}
            <path d="M 125 350 L 105 530" stroke="#4F46E5" strokeWidth="32" strokeLinecap="round" />
            <path d="M 120 350 L 100 530" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 5" opacity="0.8" />
            <path d="M 175 350 L 175 530" stroke="#4F46E5" strokeWidth="32" strokeLinecap="round" />
            <path d="M 170 350 L 170 530" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 5" opacity="0.8" />

            {/* SHOES */}
            <path d="M 75 530 L 125 530 L 130 550 L 65 550 Z" fill="#1E293B" />
            <rect x="65" y="546" width="65" height="8" rx="2" fill="#FFFFFF" />
            <path d="M 150 530 L 200 530 L 205 550 L 140 550 Z" fill="#1E293B" />
            <rect x="140" y="546" width="65" height="8" rx="2" fill="#FFFFFF" />

            {/* TORSO */}
            <path d="M 110 200 L 190 200 L 185 360 L 105 360 Z" fill="#4ADE80" />
            <path d="M 125 200 L 135 290" stroke="#22C55E" strokeWidth="2.5" />
            <path d="M 175 200 L 165 300" stroke="#22C55E" strokeWidth="2.5" />

            {/* LEFT ARM HOLDING LAPTOP */}
            <path d="M 115 220 L 85 290 L 155 310" stroke="#4ADE80" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 155 310 L 170 310" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />

            {/* RIGHT ARM */}
            {isFormActive ? (
              <g id="pointing-arm">
                <path d="M 185 210 L 265 180" stroke="#4ADE80" strokeWidth="22" strokeLinecap="round" />
                <path d="M 265 180 L 290 170" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />
              </g>
            ) : (
              <g id="resting-arm">
                <path d="M 185 220 L 225 285 L 185 310" stroke="#4ADE80" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 185 310 L 195 315" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />
              </g>
            )}

            {/* LAPTOP DEVICE */}
            <g id="laptop">
              <path d="M 240 305 L 180 240 L 188 234 L 248 299 Z" fill="#22242A" />
              <path d="M 235 303 L 182 244 L 176 250 L 229 307 Z" fill="#38BDF8" />
              <path d="M 225 298 L 186 252 L 182 256 L 221 302 Z" fill="#7DD3FC" />
              <path d="M 180 248 L 230 300 L 155 210 Z" fill="#38BDF8" opacity="0.25" />
              <rect x="145" y="300" width="95" height="12" rx="4" fill="#22242A" />
            </g>

            {/* HEAD */}
            <rect x="140" y="165" width="22" height="38" fill="#FDBA74" />
            <circle cx="150" cy="140" r="28" fill="#FDBA74" />
            <circle cx="122" cy="140" r="6" fill="#FDBA74" />
            <circle cx="178" cy="140" r="6" fill="#FDBA74" />
            <path d="M 152 138 L 158 143 L 152 145" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* FACE EXPRESSION */}
            {isFormActive ? (
              <g id="face-happy">
                <path d="M 142 150 C 142 165 164 165 164 150 Z" fill="#EF4444" stroke="#1E293B" strokeWidth="1.5" />
                <path d="M 136 136 L 142 130 L 136 124" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M 164 136 L 158 130 L 164 124" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M 136 126 Q 142 120 148 126" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 152 126 Q 158 120 164 126" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              <g id="face-idle">
                <path d="M 142 158 C 146 150 156 150 160 158" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="140" cy="132" r="3" fill="#1E293B" />
                <circle cx="160" cy="132" r="3" fill="#1E293B" />
                <path d="M 134 124 L 144 127" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                <path d="M 166 124 L 156 127" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {/* HAIR */}
            <path
              d="M 120 135 C 115 105 140 95 160 95 C 180 95 185 110 182 135 C 178 118 168 112 155 115 C 142 118 130 115 120 135 Z"
              fill="#1E293B"
            />
          </g>
        </svg>
      </View>
    );
  }

  // Mobile Native Fallback for APK
  return (
    <View style={[styles.container, { maxHeight: maxIllustrationHeight }]}>
      <Svg viewBox="20 40 740 530" preserveAspectRatio="xMidYMid meet" style={styles.svg}>
        <Defs>
          <LinearGradient id="sandGradientNative" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FDB813" />
            <Stop offset="100%" stopColor="#FFC83B" />
          </LinearGradient>
          <LinearGradient id="clipboardGradNative" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F8FAFC" />
          </LinearGradient>
        </Defs>

        {/* Static Background Gears for Mobile APK */}
        <G id="background-gears">
          <Path
            d="M340 70 L346 82 A40 40 0 0 1 358 87 L371 84 L377 95 L366 104 A40 40 0 0 1 368 118 L380 123 L377 136 L363 134 A40 40 0 0 1 354 143 L358 156 L345 160 L338 148 A40 40 0 0 1 324 146 L313 154 L305 143 L315 132 A40 40 0 0 1 312 118 L299 115 L301 101 L314 102 A40 40 0 0 1 323 92 L317 79 L329 73 L338 83 A40 40 0 0 1 340 70 Z"
            fill="#E2E8F0"
          />
          <Circle cx="340" cy="110" r="18" fill="#E2E8F0" />
          <Circle cx="340" cy="110" r="10" fill="#F8FAFC" />
          <Path
            d="M90 290 L94 299 A30 30 0 0 1 103 303 L113 300 L117 309 L109 316 A30 30 0 0 1 110 327 L119 331 L116 340 L105 338 A30 30 0 0 1 98 345 L101 355 L91 358 L86 349 A30 30 0 0 1 76 347 L67 353 L61 344 L69 336 A30 30 0 0 1 67 325 L57 323 L59 312 L69 313 A30 30 0 0 1 76 305 L71 295 L80 291 L87 299 A30 30 0 0 1 90 290 Z"
            fill="#E2E8F0"
          />
          <Circle cx="90" cy="320" r="12" fill="#F8FAFC" />
          <Circle cx="640" cy="170" r="22" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="6 4" fill="none" />
          <Circle cx="640" cy="170" r="8" fill="#E2E8F0" />
        </G>

        {/* Professional Academic / Precision Elements */}
        <Circle cx="60" cy="195" r="14" fill="#22C55E" opacity={0.15} />
        <Circle cx="60" cy="195" r="7" fill="#22C55E" />
        <Line x1="42" y1="195" x2="78" y2="195" stroke="#22C55E" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        <Line x1="60" y1="177" x2="60" y2="213" stroke="#22C55E" strokeWidth={2} strokeLinecap="round" opacity={0.6} />

        <Rect x="248" y="98" width="24" height="24" rx="6" fill="#4F46E5" />
        <Path d="M254 110 L258 114 L266 106" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        <Circle cx="710" cy="282" r="12" fill="#F96D41" opacity={0.2} />
        <Circle cx="710" cy="282" r="6" fill="#F96D41" />
        <Circle cx="710" cy="282" r="16" stroke="#F96D41" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />

        {/* Clipboard */}
        <G id="clipboard-native">
          <Rect x="315" y="75" width="260" height="425" rx="16" fill="#CBD5E1" opacity={0.4} />
          <Rect x="310" y="70" width="260" height="420" rx="16" fill="url(#clipboardGradNative)" stroke="#E2E8F0" strokeWidth="4" />
          <Rect x="310" y="70" width="260" height="36" rx="12" fill="#F96D41" />
          <Rect x="380" y="60" width="120" height="22" rx="6" fill="#22242A" />
          <Rect x="390" y="66" width="100" height="10" rx="3" fill="#F96D41" />
          <Circle cx="340" cy="130" r="10" fill="#E2E8F0" />
          <Rect x="360" y="126" width="90" height="8" rx="4" fill="#CBD5E1" />
          <Rect x="340" y="160" width="40" height="40" rx="8" fill="#FFC83B" />
          <Path d="M350 180 L357 187 L371 171" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="395" y="172" width="130" height="8" rx="4" fill="#CBD5E1" />
          <Rect x="395" y="186" width="85" height="6" rx="3" fill="#E2E8F0" />
          <Rect x="470" y="160" width="40" height="40" rx="8" fill="#00B887" />
          <Path d="M480 180 L487 187 L501 171" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="335" y1="225" x2="545" y2="225" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />
          <Rect x="340" y="300" width="22" height="60" rx="4" fill="#E2E8F0" />
          <Rect x="372" y="270" width="22" height="90" rx="4" fill="#CBD5E1" />
          <Rect x="404" y="310" width="22" height="50" rx="4" fill="#E2E8F0" />
          <Rect x="436" y="250" width="22" height="110" rx="4" fill="#00B887" opacity={0.85} />
          <Rect x="468" y="290" width="22" height="70" rx="4" fill="#CBD5E1" />
          <Path d="M400 270 L450 230 L475 242 L510 200" stroke="#FFC83B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M490 200 L510 200 L510 220" stroke="#FFC83B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </G>

        {/* Speech Badge */}
        <Circle cx="635" cy="115" r="40" fill="#00B887" />
        <Path d="M600 135 L585 155 L615 145 Z" fill="#00B887" />
        <Circle cx="635" cy="115" r="33" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity={0.4} />
        <Path d="M617 115 L629 127 L653 103" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hourglass */}
        <G id="hourglass-native">
          <Rect x="525" y="240" width="135" height="18" rx="6" fill="#F96D41" />
          <Rect x="525" y="440" width="135" height="18" rx="6" fill="#F96D41" />
          <Rect x="537" y="258" width="8" height="182" rx="3" fill="#22242A" />
          <Rect x="642" y="258" width="8" height="182" rx="3" fill="#22242A" />
          <Path d="M545 258 C545 310 580 340 592 349 C605 340 640 310 640 258 Z" fill="#FFFFFF" opacity={0.6} stroke="#22242A" strokeWidth="4" />
          <Path d="M545 440 C545 388 580 358 592 349 C605 358 640 388 640 440 Z" fill="#FFFFFF" opacity={0.6} stroke="#22242A" strokeWidth="4" />
          <Path d="M552 270 C552 310 580 335 592 345 C605 335 632 310 632 270 Z" fill="url(#sandGradientNative)" />
          <Line x1="592" y1="345" x2="592" y2="425" stroke="#FFC83B" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
          <Path d="M555 435 C565 405 585 395 592 395 C600 395 620 405 630 435 Z" fill="url(#sandGradientNative)" />
        </G>

        {/* Binder */}
        <Rect x="250" y="490" width="240" height="50" rx="8" fill="#00B887" />
        <Rect x="330" y="502" width="40" height="10" rx="2" fill="#FFFFFF" />
        <Rect x="330" y="518" width="40" height="10" rx="2" fill="#FFFFFF" />

        {/* Character */}
        <G id="character-native">
          <Path d="M 125 350 L 105 530" stroke="#4F46E5" strokeWidth="32" strokeLinecap="round" />
          <Path d="M 120 350 L 100 530" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 5" opacity={0.8} />
          <Path d="M 175 350 L 175 530" stroke="#4F46E5" strokeWidth="32" strokeLinecap="round" />
          <Path d="M 170 350 L 170 530" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 5" opacity={0.8} />
          <Path d="M 75 530 L 125 530 L 130 550 L 65 550 Z" fill="#1E293B" />
          <Rect x="65" y="546" width="65" height="8" rx="2" fill="#FFFFFF" />
          <Path d="M 150 530 L 200 530 L 205 550 L 140 550 Z" fill="#1E293B" />
          <Rect x="140" y="546" width="65" height="8" rx="2" fill="#FFFFFF" />
          <Path d="M 110 200 L 190 200 L 185 360 L 105 360 Z" fill="#4ADE80" />
          <Path d="M 125 200 L 135 290" stroke="#22C55E" strokeWidth="2.5" />
          <Path d="M 175 200 L 165 300" stroke="#22C55E" strokeWidth="2.5" />
          <Path d="M 115 220 L 85 290 L 155 310" stroke="#4ADE80" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M 155 310 L 170 310" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />
          <Path d="M 185 220 L 225 285 L 185 310" stroke="#4ADE80" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M 185 310 L 195 315" stroke="#FDBA74" strokeWidth="12" strokeLinecap="round" />
          <Path d="M 240 305 L 180 240 L 188 234 L 248 299 Z" fill="#22242A" />
          <Path d="M 235 303 L 182 244 L 176 250 L 229 307 Z" fill="#38BDF8" />
          <Path d="M 225 298 L 186 252 L 182 256 L 221 302 Z" fill="#7DD3FC" />
          <Path d="M 180 248 L 230 300 L 155 210 Z" fill="#38BDF8" opacity={0.25} />
          <Rect x="145" y="300" width="95" height="12" rx="4" fill="#22242A" />
          <Rect x="140" y="165" width="22" height="38" fill="#FDBA74" />
          <Circle cx="150" cy="140" r="28" fill="#FDBA74" />
          <Circle cx="122" cy="140" r="6" fill="#FDBA74" />
          <Circle cx="178" cy="140" r="6" fill="#FDBA74" />
          <Path d="M 152 138 L 158 143 L 152 145" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M 142 158 C 146 150 156 150 160 158" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Circle cx="140" cy="132" r="3" fill="#1E293B" />
          <Circle cx="160" cy="132" r="3" fill="#1E293B" />
          <Path d="M 134 124 L 144 127" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <Path d="M 166 124 L 156 127" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <Path
            d="M 120 135 C 115 105 140 95 160 95 C 180 95 185 110 182 135 C 178 118 168 112 155 115 C 142 118 130 115 120 135 Z"
            fill="#1E293B"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 740 / 530,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  svg: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
});
