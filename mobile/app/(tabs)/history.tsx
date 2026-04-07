import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useHistory } from '../../hooks/useHistory'
import { LEGAL_CATEGORIES } from '../../constants/categories'

export default function HistoryScreen() {
  const router = useRouter()
  const { data: sessions, isLoading } = useHistory()

  const getCategoryLabel = (categoryId: string) => {
    return LEGAL_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>상담 이력이 없습니다.</Text>
        <Text style={styles.emptySubtext}>홈 화면에서 법률 상담을 시작해보세요.</Text>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={sessions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.categoryBadge}>{getCategoryLabel(item.category)}</Text>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString('ko-KR')}
            </Text>
          </View>
          <Text style={styles.sessionTitle}>{item.title}</Text>
          <Text style={styles.messageCount}>{item.message_count}개 메시지</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a90d9',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  messageCount: {
    fontSize: 12,
    color: '#999',
  },
})
