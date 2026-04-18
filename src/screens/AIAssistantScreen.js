import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert
} from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { assistantAsk } from '../api/api';

export default function AIAssistantScreen({ navigation, route }) {
  const { barcode, productName } = route.params || {};

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: barcode
        ? `Bonjour ! Je suis votre assistant nutritionnel. Posez-moi vos questions sur "${productName || 'ce produit'}".`
        : "Bonjour ! Je suis votre assistant nutritionnel. Scannez d'abord un produit pour me poser des questions."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const suggested = [
    'Est-ce sûr pour les enfants ?',
    'Ce produit est-il recommandé pour les diabétiques ?',
    'Quels sont les risques des additifs détectés ?',
    "Y a-t-il des alternatives plus saines ?",
  ];

  const handleSend = async () => {
    if (!question.trim()) return;
    if (!barcode) {
      Alert.alert('Attention', "Scannez d'abord un produit");
      return;
    }

    const q = question.trim();
    setMessages(prev => [...prev, { type: 'user', text: q }]);
    setQuestion('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // assistantAsk(barcode, question)
      // POST /assistant/ask { barcode, question }
      // returns { answer: "..." }
      const data = await assistantAsk(barcode, q);
      const answer = data?.answer || 'Désolé, je n\'ai pas pu répondre.';
      setMessages(prev => [...prev, { type: 'bot', text: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Désolé, le service IA est temporairement indisponible."
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSuggested = (q) => setQuestion(q);

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Assistant IA</Text>
          {productName && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {productName}
            </Text>
          )}
        </View>
        <View style={styles.aiBadge}>
          <Text style={{ fontSize: 18 }}>🤖</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.msgRow,
              msg.type === 'user' ? styles.userRow : styles.botRow
            ]}
          >
            {msg.type === 'bot' && (
              <Text style={styles.botAvatar}>🤖</Text>
            )}
            <View style={[
              styles.bubble,
              msg.type === 'user' ? styles.userBubble : styles.botBubble
            ]}>
              <Text style={[
                styles.bubbleTxt,
                msg.type === 'user' ? styles.userTxt : styles.botTxt
              ]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.botRow}>
            <Text style={styles.botAvatar}>🤖</Text>
            <View style={styles.botBubble}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          </View>
        )}

        {/* Suggested questions */}
        {messages.length === 1 && barcode && (
          <View style={styles.suggested}>
            <Text style={styles.suggestedTitle}>Questions suggérées</Text>
            {suggested.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chip}
                onPress={() => handleSuggested(q)}
              >
                <Text style={styles.chipTxt}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Posez votre question..."
          placeholderTextColor={Colors.textGray}
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!question.trim() || loading) && styles.sendBtnDisabled
          ]}
          onPress={handleSend}
          disabled={!question.trim() || loading}
        >
          <Text style={styles.sendTxt}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backTxt: { fontSize: 24, color: Colors.primary, marginRight: 12 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bold, color: Colors.primary },
  headerSub: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray },
  aiBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  userRow: { flexDirection: 'row-reverse' },
  botRow: { flexDirection: 'row' },
  botAvatar: { fontSize: 24, marginRight: 8, marginBottom: 4 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleTxt: { fontSize: 14, lineHeight: 22 },
  userTxt: { fontFamily: Fonts.regular, color: Colors.textLight },
  botTxt: { fontFamily: Fonts.regular, color: Colors.textDark },
  suggested: { marginTop: 16 },
  suggestedTitle: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.textGray, marginBottom: 8 },
  chip: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8, alignSelf: 'flex-start' },
  chipTxt: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.primary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  input: { flex: 1, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.regular, color: Colors.textDark, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendTxt: { fontSize: 20, color: Colors.textLight, fontWeight: 'bold' },
});