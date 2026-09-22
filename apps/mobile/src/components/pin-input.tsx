import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/components/stock-ui';

export function PinInput({ value, onChangeText, length = 4 }: { value: string; onChangeText: (text: string) => void; length?: number }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(digitsOnly);
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry
      />
      <View style={styles.dotsRow} pointerEvents="none">
        {Array.from({ length }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < value.length && styles.dotFilled,
              focused && index === value.length && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center' },
    hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
    dotsRow: { flexDirection: 'row', gap: 16 },
    dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white },
    dotFilled: { backgroundColor: colors.green, borderColor: colors.green },
    dotActive: { borderColor: colors.green },
  });
}