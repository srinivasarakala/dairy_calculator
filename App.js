import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Alert, FlatList, Keyboard, Platform, Pressable } from 'react-native';
import { Share } from 'react-native';

const styles = StyleSheet.create({
  productInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productPrice: {
    marginTop: 4,
    color: '#374151',
  },
  quantityInput: {
    width: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  lineTotal: {
    width: 60,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  summaryBox: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  clearButton: {
    marginTop: 12,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#111827',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#4b5563',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  savedProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  savedPriceInput: {
    width: 110,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonCompact: {
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    color: '#6b7280',
  },
});

export default function App() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const [productDraft, setProductDraft] = useState({ name: '', price: '' });
  const [priceDrafts, setPriceDrafts] = useState({});
  const [hideBottomBar, setHideBottomBar] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('products').then((data) => {
      if (data) setProducts(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  const updateQuantity = (id, value) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const clearAllQuantities = () => {
    setQuantities({});
  };

  const addProduct = () => {
    if (!productDraft.name || !productDraft.price) return;
    setProducts((prev) => [
      ...prev,
      { id: Date.now().toString(), name: productDraft.name, price: Number(productDraft.price) },
    ]);
    setProductDraft({ name: '', price: '' });
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setQuantities((prev) => {
      const q = { ...prev };
      delete q[id];
      return q;
    });
  };

  const saveEditedPrice = (id) => {
    const newPrice = priceDrafts[id];
    if (!newPrice || isNaN(Number(newPrice))) return;
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, price: Number(newPrice) } : p));
  };

  const totalPrice = useMemo(() => {
    return products.reduce((sum, product) => {
      const qty = Number(quantities[product.id] || 0);
      return sum + qty * product.price;
    }, 0);
  }, [products, quantities]);

  // Home Screen
  const renderHome = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>Calculator</Text>
      {products.length === 0 ? (
        <Text style={styles.emptyText}>No products added yet.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const lineTotal = Number(quantities[item.id] || 0) * item.price;
            return (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                backgroundColor: '#f3f4f6',
                borderRadius: 6,
                paddingVertical: 3,
                paddingHorizontal: 6,
                minWidth: 0,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827' }}>{item.name}</Text>
                </View>
                <TextInput
                  style={[styles.quantityInput, { marginHorizontal: 4, height: 28, fontSize: 12 }]}
                  keyboardType="numeric"
                  value={quantities[item.id] ?? ''}
                  onChangeText={(text) => updateQuantity(item.id, text)}
                  placeholder="Qty"
                />
                <Text style={[styles.lineTotal, { marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#059669' }]}>₹{lineTotal.toFixed(2)}</Text>
              </View>
            );
          }}
        />
      )}
      {!hideBottomBar && (
        <View style={styles.summaryBox}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>₹{totalPrice.toFixed(2)}</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
        <Pressable
          style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10 }, { backgroundColor: '#dc2626' }]}
          onPress={clearAllQuantities}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Clear</Text>
        </Pressable>
        <Pressable
          style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginLeft: 8 }, { backgroundColor: '#2563eb' }]}
          disabled={totalPrice === 0}
          onPress={async () => {
            if (totalPrice === 0) return;
            let bill = 'Dairy Bill\n\n';
            products.forEach((product) => {
              const qty = Number(quantities[product.id] || 0);
              if (qty > 0) {
                bill += `${product.name}: ${qty} x ₹${product.price} = ₹${(qty * product.price).toFixed(2)}\n`;
              }
            });
            bill += `\nTotal: ₹${totalPrice.toFixed(2)}`;
            try {
              await Share.share({ message: bill });
            } catch (e) {
              Alert.alert('Share Error', 'Could not share bill.');
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Share</Text>
        </Pressable>
      </View>
    </View>
  );

  // Products Screen
  const renderSettings = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>Saved Products</Text>
      {products.length === 0 ? (
        <Text style={styles.emptyText}>No products added yet.</Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 6 }}>
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, color: '#374151' }}>Product</Text>
            <Text style={{ width: 110, fontWeight: '700', fontSize: 13, color: '#374151', textAlign: 'center' }}>Unit Price</Text>
            <Text style={{ width: 60, fontWeight: '700', fontSize: 13, color: '#374151', textAlign: 'center' }}>Delete</Text>
          </View>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                backgroundColor: '#f3f4f6',
                borderRadius: 6,
                paddingVertical: 3,
                paddingHorizontal: 6,
                minWidth: 0,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827' }}>{item.name}</Text>
                </View>
                <TextInput
                  style={[styles.savedPriceInput, { marginHorizontal: 4, height: 36, fontSize: 14, width: 110, textAlign: 'center', paddingVertical: 8 }]}
                  keyboardType="decimal-pad"
                  value={priceDrafts[item.id] ?? String(item.price)}
                  onChangeText={(text) => setPriceDrafts((prev) => ({ ...prev, [item.id]: text }))}
                  onSubmitEditing={() => saveEditedPrice(item.id)}
                />
                <Pressable
                  style={[styles.deleteButton, styles.deleteButtonCompact, { marginLeft: 4 }]}
                  onPress={() => deleteProduct(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            )}
          />
        </>
      )}
      <View style={{ marginTop: 24 }}>
        {!showAddForm ? (
          <Pressable style={styles.primaryButton} onPress={() => setShowAddForm(true)}>
            <Text style={styles.primaryButtonText}>Add Product</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Add Product</Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={productDraft.name}
              onChangeText={(text) => setProductDraft((prev) => ({ ...prev, name: text }))}
              placeholder="Product Name"
            />
            <Text style={styles.fieldLabel}>Price</Text>
            <TextInput
              style={styles.fieldInput}
              value={productDraft.price}
              onChangeText={(text) => setProductDraft((prev) => ({ ...prev, price: text }))}
              keyboardType="decimal-pad"
              placeholder="Product Price"
            />
            <View style={{ flexDirection: 'row' }}>
              <Pressable
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => { setProductDraft({ name: '', price: '' }); setShowAddForm(false); }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={addProduct}
              >
                <Text style={styles.primaryButtonText}>Add</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: 24 }}>
      <StatusBar style="auto" />
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d1d5db', marginTop: 32 }}>
        <Pressable
          style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginRight: 8 }, { backgroundColor: activeTab === 'home' ? '#2563eb' : '#e5e7eb' }]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={{ color: activeTab === 'home' ? '#fff' : '#2563eb', fontWeight: '700', fontSize: 16 }}>Home</Text>
        </Pressable>
        <Pressable
          style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10 }, { backgroundColor: activeTab === 'settings' ? '#2563eb' : '#e5e7eb' }]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={{ color: activeTab === 'settings' ? '#fff' : '#2563eb', fontWeight: '700', fontSize: 16 }}>Products</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        {activeTab === 'home' ? renderHome() : renderSettings()}
      </View>
    </SafeAreaView>
  );
}
