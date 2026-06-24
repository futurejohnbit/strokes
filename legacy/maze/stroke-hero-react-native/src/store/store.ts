import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import bluetoothReducer from './slices/bluetoothSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    bluetooth: bluetoothReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['bluetooth/deviceConnected'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;