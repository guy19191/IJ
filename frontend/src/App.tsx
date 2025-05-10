import React from 'react';
import MainLayout from './components/layout/MainLayout';
import AIChat from './components/chat/AIChat';
import Card from './components/ui/Card';
import Button from './components/ui/Button';

const App: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Next-Gen AI Interface
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Experience the future of human-AI interaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold">Smart Features</h2>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span className="text-primary-500">✨</span>
                <span>Adaptive Learning</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-500">🎯</span>
                <span>Contextual Understanding</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-500">⚡</span>
                <span>Real-time Processing</span>
              </li>
            </ul>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl font-semibold">AI Capabilities</h2>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span className="text-primary-500">🤖</span>
                <span>Natural Language Processing</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-500">🎨</span>
                <span>Creative Generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-500">🔍</span>
                <span>Pattern Recognition</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Try It Now</h2>
          <AIChat />
        </div>

        <div className="text-center space-y-4">
          <Button size="lg" className="mx-auto">
            Get Started
          </Button>
          <p className="text-sm text-neutral-500">
            Experience the future of AI interaction today
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default App; 