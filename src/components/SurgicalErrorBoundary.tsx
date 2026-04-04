import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class SurgicalErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    componentStack: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SurgicalErrorBoundary: ${this.props.name || 'unnamed'}] CAUGHT ERROR:`, error.message);
    console.error('[SurgicalErrorBoundary] COMPONENT STACK:', info.componentStack);
    this.setState({ componentStack: info.componentStack || null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1A0000', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#FF4444', fontSize: 18, fontWeight: '900', marginBottom: 12 }}>
            ❌ CRASH en: {this.props.name || 'desconocido'}
          </Text>
          <Text style={{ color: '#FF8888', fontSize: 13, marginBottom: 16 }}>
            {this.state.error?.message}
          </Text>
          <ScrollView>
            <Text style={{ color: '#FFAAAA', fontSize: 11, fontFamily: 'monospace' }}>
              {this.state.componentStack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
