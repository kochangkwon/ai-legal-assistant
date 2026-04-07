import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { getPrecedent } from '../../services/api'

interface PrecedentDetail {
  id: string
  case_number: string
  court: string
  decided_at: string
  case_name: string
  summary: string
  full_text: string
  related_laws: string[]
}

export default function PrecedentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [precedent, setPrecedent] = useState<PrecedentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const response = await getPrecedent(id || '')
        if (response.success) {
          setPrecedent(response.data as PrecedentDetail)
        }
      } catch {
        // 에러 처리
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4a90d9" />
      </View>
    )
  }

  if (!precedent) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>판례를 찾을 수 없습니다.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.caseName}>{precedent.case_name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{precedent.court}</Text>
          <Text style={styles.meta}>{precedent.case_number}</Text>
          <Text style={styles.meta}>{precedent.decided_at}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>판결 요지</Text>
        <Text style={styles.sectionContent}>{precedent.summary}</Text>
      </View>

      {precedent.related_laws.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관련 법조문</Text>
          {precedent.related_laws.map((law, i) => (
            <Text key={i} style={styles.lawItem}>
              {law}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>판례 전문</Text>
        <Text style={styles.fullText}>{precedent.full_text}</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          본 정보는 법률 정보 제공 목적이며, 법률 자문을 대체하지 않습니다.
          정확한 판례 내용은 법제처 원문을 확인하세요.
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  caseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontSize: 13,
    color: '#aaa',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  lawItem: {
    fontSize: 14,
    color: '#4a90d9',
    marginBottom: 4,
  },
  fullText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  disclaimer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
})
