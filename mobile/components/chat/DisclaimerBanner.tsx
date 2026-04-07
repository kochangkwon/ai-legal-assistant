import { View, Text, StyleSheet } from 'react-native'

export default function DisclaimerBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        본 서비스는 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않습니다.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  text: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 18,
  },
})
