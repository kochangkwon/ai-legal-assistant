import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { LegalCategory } from '../../types'
import { useHistory } from '../../hooks/useHistory'
import { LEGAL_CATEGORIES } from '../../constants/categories'
import CategorySelector from '../../components/common/CategorySelector'
import DisclaimerBanner from '../../components/chat/DisclaimerBanner'

export default function HomeScreen() {
  const router = useRouter()
  const { data: sessions } = useHistory()
  const recentSessions = sessions?.slice(0, 3)

  const handleCategorySelect = (category: LegalCategory) => {
    router.push(`/chat/${category}`)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요</Text>
        <Text style={styles.title}>AI 법률 도우미</Text>
        <Text style={styles.subtitle}>
          어떤 법률 분야에 대해 알아보시겠어요?
        </Text>
      </View>

      <DisclaimerBanner />

      {/* 카테고리 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>법률 분야 선택</Text>
        <CategorySelector onSelect={handleCategorySelect} />
      </View>

      {/* 최근 상담 */}
      {recentSessions && recentSessions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 상담</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          {recentSessions.map((session) => {
            const cat = LEGAL_CATEGORIES.find(c => c.id === session.category)
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.recentCard}
                onPress={() => router.push(`/chat/${session.id}`)}
              >
                <Text style={styles.recentIcon}>{cat?.icon || '📄'}</Text>
                <View style={styles.recentContent}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {session.title || '새 상담'}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {cat?.label} · {new Date(session.created_at).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* 안내 카드 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>이용 안내</Text>
        <Text style={styles.infoText}>
          1. 법률 분야를 선택하세요{'\n'}
          2. 궁금한 법률 질문을 입력하세요{'\n'}
          3. AI가 관련 판례를 찾아 답변해드립니다{'\n'}
          4. 판례 카드를 탭하면 상세 내용을 볼 수 있습니다
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#a0a0b8',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#c0c0d0',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#4a90d9',
    marginBottom: 12,
  },
  // 최근 상담
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentIcon: {
    fontSize: 24,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  recentMeta: {
    fontSize: 12,
    color: '#999',
  },
  // 안내 카드
  infoCard: {
    backgroundColor: '#e8f0fe',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
  },
})
