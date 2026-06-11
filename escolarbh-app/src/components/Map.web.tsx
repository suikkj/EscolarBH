import React from 'react';
import { View, Text } from 'react-native';

export default function MapView(props: any) {
  return (
    <View {...props} style={[props.style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }]}>
      <Text>📍 Mapa (Apenas no Aplicativo)</Text>
      {props.children}
    </View>
  );
}

export const Marker = (props: any) => <View {...props} />;
export const Polyline = (props: any) => <View {...props} />;
export const PROVIDER_DEFAULT = null;
