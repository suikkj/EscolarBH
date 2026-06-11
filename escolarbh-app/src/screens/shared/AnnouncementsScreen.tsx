import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { supabase } from '../../services/api';
import { useAuth } from '../../hooks/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  criado_em: string;
  is_broadcast: boolean;
};

export default function AnnouncementsScreen() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const fetchMessages = async () => {
    if (!user) return;
    
    let query = supabase.from('messages').select('*').order('criado_em', { ascending: false });
    
    // Motorista vê as mensagens que ele enviou ou recebeu, Pai vê mensagens pra ele ou broadcast
    if (role === 'CONTRATANTE') {
      query = query.or(`recipient_id.eq.${user.id},is_broadcast.eq.true`);
    } else {
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
    }

    const { data, error } = await query;
    if (data && !error) {
      setMessages(data);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    // Se for motorista, manda como Broadcast por padrão nessa tela simplificada
    const isBroadcast = role === 'MOTORISTA';
    
    // Se for pai, o recipient idealmente é o motorista da rota, mas vamos deixar null (o motorista pega todos com is_broadcast false para ler)
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      content: inputText.trim(),
      is_broadcast: isBroadcast
    });

    if (!error) {
      setInputText('');
      fetchMessages();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;

    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        {item.is_broadcast && !isMine && <Text style={styles.broadcastLabel}>Aviso Geral</Text>}
        <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
          {item.content}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.list}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite um comunicado..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  list: {
    padding: theme.spacing.md,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.brand[500],
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  broadcastLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.status.warning,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    color: theme.colors.text.primary,
  },
  sendButton: {
    marginLeft: theme.spacing.sm,
    width: 48,
    height: 48,
    backgroundColor: theme.colors.brand[500],
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
});
