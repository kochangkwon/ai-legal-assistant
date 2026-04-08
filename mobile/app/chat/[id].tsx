import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useChat } from '../../hooks/useChat'
import { LegalCategory, Message } from '../../types'
import { LEGAL_CATEGORIES } from '../../constants/categories'
import ChatBubble from '../../components/chat/ChatBubble'
import LoadingSteps from '../../components/chat/LoadingSteps'
import DisclaimerBanner from '../../components/chat/DisclaimerBanner'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // 카테고리 ID인지 세션 ID(UUID)인지 판별
  const isCategory = LEGAL_CATEGORIES.some(c => c.id === id)
  const category = (isCategory ? id : 'civil') as LegalCategory
  const existingSessionId = isCategory ? undefined : id

  const categoryInfo = LEGAL_CATEGORIES.find(c => c.id === category)
  const navigation = useNavigation()

  // 헤더에 법률 분야 표시
  React.useEffect(() => {
    navigation.setOptions({
      title: categoryInfo ? `${categoryInfo.icon} ${categoryInfo.label} 상담` : '법률 상담',
    })
  }, [navigation, categoryInfo])

  const { messages, isLoading, isLoadingHistory, loadingStep, sendMessage } = useChat(
    existingSessionId ? { category, existingSessionId } : category
  )
  const [inputText, setInputText] = useState('')
  const flatListRef = useRef<FlatList<Message>>(null)

  const handleSend = () => {
    const text = inputText.trim()
    if (!text || isLoading) return
    setInputText('')
    sendMessage(text)
  }

  const isEmpty = messages.length === 0 && !isLoading && !isLoadingHistory

  if (isLoadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
        <Text style={styles.loadingText}>이전 대화를 불러오는 중...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <DisclaimerBanner />

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{categoryInfo?.icon || '⚖️'}</Text>
          <Text style={styles.emptyTitle}>
            {categoryInfo?.label || '법률'} 상담
          </Text>
          <Text style={styles.emptyDescription}>
            {categoryInfo?.description}{'\n\n'}
            궁금한 법률 질문을 입력해주세요.{'\n'}
            관련 판례를 찾아 답변해드립니다.
          </Text>
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>질문 예시</Text>
            {getExamples(category).map((example, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exampleChip}
                onPress={() => {
                  setInputText(example)
                }}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.messageList}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true })
          }}
          ListFooterComponent={
            isLoading ? <LoadingSteps step={loadingStep} /> : null
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="법률 질문을 입력하세요..."
          placeholderTextColor="#999"
          multiline
          maxLength={2000}
          editable={!isLoading}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function getExamples(category: LegalCategory): string[] {
  const examples: Record<LegalCategory, string[]> = {
    civil: [
      '계약을 해지하고 싶은데 위약금이 있나요?',
      '손해배상 청구는 어떻게 하나요?',
    ],
    criminal: [
      '명예훼손으로 고소하려면 어떻게 해야 하나요?',
      '사기 피해를 입었는데 어떻게 대응하나요?',
    ],
    family: [
      '이혼 시 재산분할은 어떻게 되나요?',
      '양육권은 어떤 기준으로 결정되나요?',
    ],
    labor: [
      '부당해고를 당했는데 어떻게 해야 하나요?',
      '임금 체불 시 대처 방법이 궁금합니다',
    ],
    realestate: [
      '임대차 보증금을 못 돌려받고 있어요',
      '전세 계약 갱신 거절 사유가 궁금합니다',
    ],
  }
  return examples[category] || examples.civil
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
  },
  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  exampleContainer: {
    marginTop: 28,
    width: '100%',
    gap: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  exampleChip: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exampleText: {
    fontSize: 14,
    color: '#4a90d9',
  },
  // 메시지 목록
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 12,
  },
  // 입력
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
})
