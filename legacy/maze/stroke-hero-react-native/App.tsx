import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store/store';

// 導入畫面組件
import MainMenu from './src/screens/MainMenu/MainMenu';
import GameScreen from './src/screens/GameScreen/GameScreen';

// 創建導航堆疊
const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="MainMenu"
          screenOptions={{
            headerShown: false, // 隱藏默認標題欄
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          {/* 主選單 */}
          <Stack.Screen
            name="MainMenu"
            component={MainMenu}
            options={{
              title: '筆劃俠客',
            }}
          />

          {/* 遊戲畫面 */}
          <Stack.Screen
            name="GameScreen"
            component={GameScreen}
            options={{
              title: '遊戲中',
              gestureEnabled: false, // 遊戲中禁用手勢返回
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;