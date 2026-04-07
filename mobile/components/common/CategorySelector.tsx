import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LEGAL_CATEGORIES, CategoryItem } from '../../constants/categories'
import { LegalCategory } from '../../types'

interface Props {
  onSelect: (category: LegalCategory) => void
  selected?: LegalCategory
  compact?: boolean
}

export default function CategorySelector({ onSelect, selected, compact }: Props) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {LEGAL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              selected === cat.id && styles.chipSelected,
            ]}
            onPress={() => onSelect(cat.id)}
          >
            <Text style={styles.chipIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.chipLabel,
                selected === cat.id && styles.chipLabelSelected,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.gridContainer}>
      {LEGAL_CATEGORIES.map((cat) => (
        <CategoryCard key={cat.id} category={cat} onPress={() => onSelect(cat.id)} />
      ))}
    </View>
  )
}

function CategoryCard({
  category,
  onPress,
}: {
  category: CategoryItem
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconCircle}>
        <Text style={styles.cardIcon}>{category.icon}</Text>
      </View>
      <Text style={styles.cardLabel}>{category.label}</Text>
      <Text style={styles.cardDescription}>{category.description}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // 컴팩트 (칩) 모드
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  chipSelected: {
    backgroundColor: '#4a90d9',
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  chipLabelSelected: {
    color: '#ffffff',
  },
  // 그리드 (카드) 모드
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 17,
  },
})
