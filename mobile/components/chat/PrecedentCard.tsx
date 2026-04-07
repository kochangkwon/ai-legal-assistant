import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { PrecedentInfo } from '../../types'

interface Props {
  precedent: PrecedentInfo
}

export default function PrecedentCard({ precedent }: Props) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/precedent/${precedent.id}`)}
    >
      <View style={styles.header}>
        <Text style={styles.court}>{precedent.court}</Text>
        <Text style={styles.date}>{precedent.decided_at}</Text>
      </View>
      <Text style={styles.caseNumber}>{precedent.case_number}</Text>
      <Text style={styles.summary} numberOfLines={3}>
        {precedent.summary}
      </Text>
      <Text style={styles.viewMore}>판례 상세 보기</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#4a90d9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  court: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a90d9',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
  caseNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  viewMore: {
    fontSize: 12,
    color: '#4a90d9',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'right',
  },
})
