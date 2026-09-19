import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text } from 'react-native';
import { Field, PhotoPicker, PrimaryButton, Screen, SecondaryButton, useTheme } from '@/components/stock-ui';
import { useStockLite } from '@/context/StockLiteContext';

const numberValue = (value: string) => Number(value.replace(/,/g, ''));

export default function EditProductScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, updateProduct, deleteProduct } = useStockLite();
  const product = products.find((p) => p.id === id);

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCost(String(product.costPrice));
      setPrice(String(product.sellingPrice));
      setQuantity(String(product.quantity));
      setThreshold(String(product.lowStockThreshold));
      setPhotoUri(product.photoUri || null);
    }
  }, [product]);

  if (!product) {
    return (
      <Screen title="Product not found" back>
        <Text style={styles.error}>This product could not be found. It may have been deleted.</Text>
      </Screen>
    );
  }

  const hasChanges =
    name.trim() !== product.name ||
    numberValue(cost) !== product.costPrice ||
    numberValue(price) !== product.sellingPrice ||
    numberValue(quantity) !== product.quantity ||
    numberValue(threshold) !== product.lowStockThreshold ||
    (photoUri || undefined) !== (product.photoUri || undefined);

  const save = async () => {
    setError('');
    const costValue = numberValue(cost);
    const priceValue = numberValue(price);
    const quantityValue = numberValue(quantity);
    const thresholdValue = numberValue(threshold);

    if (!name.trim()) return setError('Product name is required.');
    if (
      ![costValue, priceValue].every((value) => Number.isFinite(value) && value > 0) ||
      ![quantityValue, thresholdValue].every((value) => Number.isFinite(value) && value >= 0) ||
      quantityValue % 1 !== 0 ||
      thresholdValue % 1 !== 0
    ) {
      return setError('Enter positive prices and valid whole-number stock values.');
    }

    try {
      setIsSaving(true);
      await updateProduct(product.id, {
        name: name.trim(),
        costPrice: costValue,
        sellingPrice: priceValue,
        quantity: quantityValue,
        lowStockThreshold: thresholdValue,
        photoUri: photoUri || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
        runDelete();
      }
      return;
    }
    Alert.alert('Delete product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: runDelete },
    ]);
  };

  const runDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProduct(product.id);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this product. Please try again.');
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;

  return (
    <Screen title="Edit product" subtitle="Update this item's details" back>
      <PhotoPicker uri={photoUri} onPick={setPhotoUri} label="Add product photo" />
      <Field label="Product name" value={name} onChangeText={setName} placeholder="e.g. Rice 5kg" editable={!busy} />
      <Field label="Cost price" value={cost} onChangeText={setCost} keyboardType="numeric" placeholder="0" editable={!busy} />
      <Field label="Selling price" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" editable={!busy} />
      <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" editable={!busy} />
      <Field label="Low stock threshold" value={threshold} onChangeText={setThreshold} keyboardType="numeric" placeholder="5" editable={!busy} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={isSaving ? 'Saving...' : 'Save changes'} onPress={save} disabled={busy || !hasChanges} />
      <SecondaryButton label={isDeleting ? 'Deleting...' : 'Delete product'} onPress={confirmDelete} />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({ error: { color: colors.red, marginBottom: 8 } });
}
