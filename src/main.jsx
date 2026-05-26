import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App';
import { store, persistor } from './redux/store';
import './index.css';
import './i18n';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={<div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-400">Loading state...</div>} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
