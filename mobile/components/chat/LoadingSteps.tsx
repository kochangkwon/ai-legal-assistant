import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'

interface Props {
  step: string
}

const STEPS = [
  { key: 'keyword', label: '법률 키워드 분석 중', icon: '🔍' },
  { key: 'search', label: '관련 판례 검색 중', icon: '📚' },
  { key: 'analyze', label: '판례 분석 중', icon: '⚖️' },
  { key: 'generate', label: '답변 작성 중', icon: '✍️' },
]

export default function LoadingSteps({ step }: Props) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // 단계별 자동 진행 시뮬레이션
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <View style={styles.container}>
      {STEPS.map((s, i) => (
        <View key={s.key} style={styles.stepRow}>
          <Text style={styles.stepIcon}>
            {i < currentStep ? '✅' : i === currentStep ? s.icon : '⏳'}
          </Text>
          <Text
            style={[
              styles.stepLabel,
              i === currentStep && styles.stepLabelActive,
              i < currentStep && styles.stepLabelDone,
            ]}
          >
            {s.label}
          </Text>
          {i === currentStep && <Text style={styles.dots}>...</Text>}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f4ff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  stepLabel: {
    fontSize: 14,
    color: '#999',
  },
  stepLabelActive: {
    color: '#4a90d9',
    fontWeight: '600',
  },
  stepLabelDone: {
    color: '#34a853',
  },
  dots: {
    fontSize: 14,
    color: '#4a90d9',
    fontWeight: '600',
  },
})
