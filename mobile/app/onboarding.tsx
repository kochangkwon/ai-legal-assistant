import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOnboarding } from '../hooks/useOnboarding'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon: '⚖️',
    title: 'AI 법률 도우미',
    description:
      '법률 문제로 고민이신가요?\nAI가 관련 판례와 법령을 찾아\n법률 정보를 제공해드립니다.',
  },
  {
    icon: '🔍',
    title: '판례 기반 답변',
    description:
      '대법원, 고등법원 판례를 검색하여\n실제 판결 사례에 기반한\n신뢰할 수 있는 정보를 제공합니다.',
  },
  {
    icon: '📋',
    title: '다양한 법률 분야',
    description:
      '민사, 형사, 가사, 노동, 부동산 등\n다양한 법률 분야의 질문에\n답변해드립니다.',
  },
  {
    icon: '⚠️',
    title: '중요 안내',
    description:
      '본 서비스는 법률 정보 제공 목적이며,\n변호사의 법률 자문을 대체하지 않습니다.\n\n중요한 법률 문제는 반드시\n전문 변호사와 상담하세요.',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { completeOnboarding } = useOnboarding()
  const [currentPage, setCurrentPage] = useState(0)

  const handleNext = async () => {
    if (currentPage < SLIDES.length - 1) {
      setCurrentPage(currentPage + 1)
    } else {
      // 상태만 변경 — _layout.tsx의 useEffect가 라우팅 처리
      await completeOnboarding()
    }
  }

  const handleSkip = async () => {
    // 상태만 변경 — _layout.tsx의 useEffect가 라우팅 처리
    await completeOnboarding()
  }

  const slide = SLIDES[currentPage]
  const isLast = currentPage === SLIDES.length - 1

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.skipContainer}>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentPage && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLast && styles.buttonAccept]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLast ? '동의하고 시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: 44,
  },
  skipText: {
    fontSize: 15,
    color: '#a0a0b8',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#c0c0d0',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3a3a5e',
  },
  dotActive: {
    backgroundColor: '#4a90d9',
    width: 24,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonAccept: {
    backgroundColor: '#34a853',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
})
