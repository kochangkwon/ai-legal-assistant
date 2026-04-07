import { View, Text, StyleSheet } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { Message } from '../../types'
import PrecedentCard from './PrecedentCard'

interface Props {
  message: Message
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        )}
      </View>

      {message.precedents && message.precedents.length > 0 && (
        <View style={styles.precedents}>
          {message.precedents.map((prec) => (
            <PrecedentCard key={prec.id} precedent={prec} />
          ))}
        </View>
      )}
    </View>
  )
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1a1a2e',
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1a2e',
    marginBottom: 6,
    marginTop: 10,
  },
  strong: {
    fontWeight: '600' as const,
    color: '#1a1a2e',
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  blockquote: {
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4a90d9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontSize: 13,
    color: '#c7254e',
  },
  fence: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    fontSize: 13,
  },
  paragraph: {
    marginVertical: 4,
  },
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
  },
  userBubble: {
    backgroundColor: '#4a90d9',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#ffffff',
  },
  precedents: {
    marginTop: 8,
    gap: 8,
    maxWidth: '85%',
  },
})
