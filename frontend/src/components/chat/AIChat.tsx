import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { glassMorphism } from '../../styles/design-system';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'This is a simulated AI response. In a real application, this would be connected to your AI backend.',
        type: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%]
                  ${glassMorphism.backdrop}
                  ${glassMorphism.border}
                  rounded-lg
                  p-3
                  ${
                    message.type === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  }
                `}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className={`
                ${glassMorphism.backdrop}
                ${glassMorphism.border}
                rounded-lg
                p-3
                bg-neutral-100
                dark:bg-neutral-800
              `}
            >
              <div className="flex space-x-2">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            loading={isTyping}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AIChat; 