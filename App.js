import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, StyleSheet, Text, TextInput, View, FlatList, Pressable } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share } from 'react-native';
import { Alert } from 'react-native';

const styles = StyleSheet.create({
  secondaryButton: {
    backgroundColor: '#4b5563',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    height: 48,
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
    height: 48,
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
    alignItems: 'center',
    marginTop: 8,
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
  summaryBox: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#fef9c3',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  totalLabel: {
    fontSize: 18,
    color: '#92400e',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 22,
    color: '#b45309',
    fontWeight: '900',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#374151',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    fontSize: 15,
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
});

const ProductRow = function ProductRow({ item, quantity, updateQuantity }) {
  const lineTotal = Number(quantity || 0) * item.price;
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
        style={styles.quantityInput}
        keyboardType="numeric"
        value={quantity ?? ''}
        onChangeText={(text) => updateQuantity(item.id, text)}
        placeholder="Qty"
      />
      <Text style={[styles.lineTotal, { marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#059669' }]}>₹{lineTotal.toFixed(2)}</Text>
    </View>
  );
};

function MainApp() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const [productDraft, setProductDraft] = useState({ name: '', price: '' });
  const [priceDrafts, setPriceDrafts] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [history, setHistory] = useState([]);
  const [archive, setArchive] = useState([]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      const historyData = await AsyncStorage.getItem('history');
      const archiveData = await AsyncStorage.getItem('archive');

      if (archiveData) setArchive(JSON.parse(archiveData));

      if (historyData) {
        const parsedHistory = JSON.parse(historyData);
        await autoArchiveOldBills(parsedHistory);
      }
    };

    loadData();
  }, []);

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
    setProducts(prev => [
      ...prev,
      { id: Date.now().toString(), name: productDraft.name, price: Number(productDraft.price) }
    ]);
    setProductDraft({ name: '', price: '' });
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const saveEditedPrice = (id) => {
    const newPrice = priceDrafts[id];
    if (!newPrice || isNaN(Number(newPrice))) return;
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, price: Number(newPrice) } : p));
  };

  //Archive Old Bills - Move bills older than 7 days to archive
  const autoArchiveOldBills = async (currentHistory) => {
    const today = new Date().toLocaleDateString();

    const todaysBills = currentHistory.filter(
      bill => bill.date === today
    );

    const oldBills = currentHistory.filter(
      bill => bill.date !== today
    );

    if (oldBills.length > 0) {
      const updatedArchive = [...archive, ...oldBills];

      setArchive(updatedArchive);
      await AsyncStorage.setItem(
        "archive",
        JSON.stringify(updatedArchive)
      );
    }

    setHistory(todaysBills);
    await AsyncStorage.setItem(
      "history",
      JSON.stringify(todaysBills)
    );
  };
  const totalPrice = useMemo(() => {
    return products.reduce((sum, product) => {
      const qty = Number(quantities[product.id] || 0);
      return sum + qty * product.price;
    }, 0);
  }, [products, quantities]);

  //Handle Done - Save Bill to History
  const handleDone = async () => {
    const itemsToSave = products
      .filter(p => Number(quantities[p.id] || 0) > 0)
      .map(p => ({
        name: p.name,
        qty: Number(quantities[p.id]),
        price: p.price
      }));

    if (itemsToSave.length === 0) {
      Alert.alert("No items", "Please enter quantity before saving.");
      return;
    }

    const now = new Date();

    const billEntry = {
      id: Date.now().toString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      items: itemsToSave,
      total: totalPrice
    };

    const updatedHistory = [billEntry, ...history];

    setHistory(updatedHistory);
    await AsyncStorage.setItem("history", JSON.stringify(updatedHistory));

    // Clear quantities after saving
    setQuantities({});

    Alert.alert("Saved", "Bill stored in history successfully!");
  };
  //Share Functionality
  const handleShare = async () => {
    if (totalPrice === 0) return;
    let shareText = 'Bill Details:\n';
    products.forEach((product) => {
      const qty = Number(quantities[product.id] || 0);
      if (qty > 0) {
        shareText += `${product.name}: ${qty} x ₹${product.price} = ₹${(qty * product.price).toFixed(2)}\n`;
      }
    });
    shareText += `\nGrand Total: ₹${totalPrice.toFixed(2)}`;

    const now = new Date();

    const billEntry = {
      id: Date.now().toString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      items: products
        .filter(p => Number(quantities[p.id] || 0) > 0)
        .map(p => ({
          name: p.name,
          qty: Number(quantities[p.id]),
          price: p.price
        })),
      total: totalPrice
    };

    const updatedHistory = [billEntry, ...history];
    setHistory(updatedHistory);
    await AsyncStorage.setItem('history', JSON.stringify(updatedHistory));
    
    try {
      await Share.share({ message: shareText });
    } catch (error) {
      // Optionally handle error
    }
  };

  // Home Screen
  const renderHome = () => {
    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>Calculator</Text>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>No products added yet.</Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <ProductRow
                item={item}
                quantity={quantities[item.id]}
                updateQuantity={updateQuantity}
              />
            )}
          />
        )}

        {/* Bottom Section */}
        <View style={{ paddingVertical: 10, paddingBottom: insets.bottom  }}>
          <View style={[styles.summaryBox, { flexDirection: 'row', justifyContent: 'space-between' }]}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>₹{totalPrice.toFixed(2)}</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Pressable
              style={[{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, backgroundColor: '#dc2626' }]} 
              onPress={clearAllQuantities}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Clear</Text>
            </Pressable>

            <Pressable
              style={[{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, marginLeft: 8, backgroundColor: '#2563eb' }]} 
              disabled={totalPrice === 0}
              onPress={handleShare}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Share</Text>
            </Pressable>
            {/* Done Button */}
            <Pressable
              style={{
                flex: 1,
                backgroundColor: '#16a34a',
                padding: 14,
                borderRadius: 10,
                alignItems: 'center',
                marginLeft: 8,
              }}
              onPress={handleDone}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const today = new Date().toLocaleDateString();

  const todaysBills = history.filter(
    bill => bill.date === today
  );

  const dailyTotalAmount = todaysBills.reduce(
    (sum, bill) => sum + bill.total,
    0
  );

  const dailyTotalQuantity = todaysBills.reduce(
    (sum, bill) =>
      sum + bill.items.reduce((q, item) => q + item.qty, 0),
    0
  );
  const handleClearToday = () => {
    if (todaysBills.length === 0) {
      Alert.alert("Nothing to clear", "No bills found for today.");
      return;
    }

    Alert.alert(
      "Clear Today?",
      "This will delete all today's bills permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const remainingHistory = history.filter(
              bill => bill.date !== today
            );

            setHistory(remainingHistory);
            await AsyncStorage.setItem(
              "history",
              JSON.stringify(remainingHistory)
            );

            Alert.alert("Cleared", "Today's bills removed.");
          }
        }
      ]
    );
  };
  const renderHistory = () => (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={{
          backgroundColor: '#2563eb',
          padding: 16,
          borderRadius: 12,
          marginBottom: 16
        }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
            Today Summary
          </Text>

          <Text style={{ color: '#fff', marginTop: 6 }}>
            Bills: {todaysBills.length}
          </Text>

          <Text style={{ color: '#fff' }}>
            Total Quantity: {dailyTotalQuantity}
          </Text>

          <Text style={{ color: '#fff', fontWeight: '700', marginTop: 4 }}>
            Total Amount: ₹{dailyTotalAmount.toFixed(2)}
          </Text>
          <Pressable
            onPress={handleClearToday}
            style={{
              marginTop: 10,
              backgroundColor: '#dc2626',
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              Clear Today
            </Text>
          </Pressable>
        </View>
        
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No history yet.</Text>
      }
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: '#f3f4f6',
          padding: 12,
          borderRadius: 10,
          marginBottom: 12
        }}>
          <Text style={{ fontWeight: '700' }}>
            {item.date} - {item.time}
          </Text>

          {item.items.map((i, index) => (
            <Text key={index}>
              {i.name}: {i.qty} x ₹{i.price}
            </Text>
          ))}

          <Text style={{ fontWeight: '800', marginTop: 6 }}>
            Total: ₹{item.total.toFixed(2)}
          </Text>
        </View>
      )}
    />
  );
  // Products Screen
  const renderProducts = () => (
    <View style={{ flex: 1 }}>
      <View style={{ marginTop: 24 }}>
        {!showAddForm ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.primaryButtonText}>Add Product</Text>
          </Pressable>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Add Product</Text>

            <TextInput
              style={styles.fieldInput}
              value={productDraft.name}
              onChangeText={(text) =>
                setProductDraft((prev) => ({ ...prev, name: text }))
              }
              placeholder="Product Name"
            />

            <TextInput
              style={styles.fieldInput}
              value={productDraft.price}
              onChangeText={(text) =>
                setProductDraft((prev) => ({ ...prev, price: text }))
              }
              keyboardType="decimal-pad"
              placeholder="Product Price"
            />

            <View style={{ flexDirection: 'row' }}>
              <Pressable
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]} 
                onPress={() => {
                  setProductDraft({ name: '', price: '' });
                  setShowAddForm(false);
                }}
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
          </View>
        )}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Saved Products</Text>

            {products.length > 0 && (
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Text style={{ flex: 1, fontWeight: '700', fontSize: 13 }}>Product</Text>
                <Text style={{ width: 110, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
                  Unit Price
                </Text>
                <Text style={{ width: 60, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
                  Delete
                </Text>
              </View>
            )}
          </>
        }

        renderItem={({ item }) => (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
            backgroundColor: '#f3f4f6',
            borderRadius: 6,
            paddingVertical: 3,
            paddingHorizontal: 6,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13 }}>{item.name}</Text>
            </View>

            <TextInput
              style={[styles.savedPriceInput, { marginHorizontal: 4 }]} 
              keyboardType="decimal-pad"
              value={priceDrafts[item.id] ?? String(item.price)}
              onChangeText={(text) =>
                setPriceDrafts((prev) => ({ ...prev, [item.id]: text }))
              }
              onSubmitEditing={() => saveEditedPrice(item.id)}
            />

            <Pressable
              style={[styles.deleteButton, { marginLeft: 4 }]} 
              onPress={() => deleteProduct(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );

  return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar style="auto" />
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d1d5db', marginTop: 32, paddingTop: insets.top,paddingHorizontal: 16 }}>
          <Pressable
            style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginRight: 8 }, { backgroundColor: activeTab === 'home' ? '#2563eb' : '#e5e7eb' }]} 
            onPress={() => setActiveTab('home')}
          >
            <Text style={{ color: activeTab === 'home' ? '#fff' : '#2563eb', fontWeight: '700', fontSize: 16 }}>Home</Text>
          </Pressable>
          <Pressable
            style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginRight: 8 }, 
            { backgroundColor: activeTab === 'history' ? '#2563eb' : '#e5e7eb' }]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={{ color: activeTab === 'history' ? '#fff' : '#2563eb', fontWeight: '700' }}>
              History
            </Text>
          </Pressable>
          <Pressable
            style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10 }, { backgroundColor: activeTab === 'products' ? '#2563eb' : '#e5e7eb' }]} 
            onPress={() => setActiveTab('products')}
          >
            <Text style={{ color: activeTab === 'products' ? '#fff' : '#2563eb', fontWeight: '700', fontSize: 16 }}>Products</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, padding: 16 }}>
          {activeTab === 'home'
            ? renderHome()
            : activeTab === 'products'
            ? renderProducts()
            : renderHistory()}
        </View>
      </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}
