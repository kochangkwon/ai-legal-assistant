import { View, Text, StyleSheet } from 'react-native'

export default function ChatTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        홈 화면에서 법률 분야를 선택하여 상담을 시작하세요.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})
