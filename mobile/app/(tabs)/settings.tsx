import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import DisclaimerBanner from '../../components/chat/DisclaimerBanner'

export default function SettingsScreen() {
  const router = useRouter()

  const handleResetOnboarding = async () => {
    Alert.alert(
      '온보딩 초기화',
      '온보딩 화면을 다시 표시할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          onPress: async () => {
            await AsyncStorage.removeItem('onboarding_completed')
            Alert.alert('완료', '앱을 다시 시작하면 온보딩이 표시됩니다.')
          },
        },
      ],
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 면책 고지 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>면책 고지</Text>
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>⚠️</Text>
          <Text style={styles.disclaimerText}>
            본 서비스는 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않습니다.
            {'\n\n'}
            AI가 제공하는 답변은 관련 판례와 법령에 기반한 일반적인 정보이며,
            개별 사안에 대한 정확한 법률적 판단을 위해서는 반드시 전문 변호사와 상담하시기 바랍니다.
            {'\n\n'}
            판례 정보는 법제처 Open API를 통해 제공되며, 최신 정보와 다를 수 있습니다.
          </Text>
        </View>
      </View>

      {/* 앱 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.infoCard}>
          <InfoRow label="앱 이름" value="AI 법률 도우미" />
          <InfoRow label="버전" value="1.0.0" />
          <InfoRow label="AI 엔진" value="Gemini 2.5 Flash" />
          <InfoRow label="판례 데이터" value="법제처 Open API" />
        </View>
      </View>

      {/* 데이터 소스 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>데이터 출처</Text>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => Linking.openURL('https://www.law.go.kr')}
        >
          <Text style={styles.linkIcon}>🏛️</Text>
          <View style={styles.linkContent}>
            <Text style={styles.linkTitle}>국가법령정보센터</Text>
            <Text style={styles.linkUrl}>law.go.kr</Text>
          </View>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => Linking.openURL('https://open.law.go.kr')}
        >
          <Text style={styles.linkIcon}>📡</Text>
          <View style={styles.linkContent}>
            <Text style={styles.linkTitle}>법제처 Open API</Text>
            <Text style={styles.linkUrl}>open.law.go.kr</Text>
          </View>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 기타 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기타</Text>
        <TouchableOpacity style={styles.actionCard} onPress={handleResetOnboarding}>
          <Text style={styles.actionText}>온보딩 다시 보기</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        © 2026 AI 법률 도우미. All rights reserved.
      </Text>
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  // 면책 고지
  disclaimerCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  disclaimerIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 22,
  },
  // 앱 정보
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  // 링크
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  linkIcon: {
    fontSize: 24,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  linkUrl: {
    fontSize: 12,
    color: '#4a90d9',
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 16,
    color: '#ccc',
  },
  // 액션
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    color: '#4a90d9',
    fontWeight: '500',
  },
  // 푸터
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bbb',
    marginTop: 32,
    marginBottom: 16,
  },
})
