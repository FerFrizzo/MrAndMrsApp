import React, { createContext, useContext, useState } from 'react';
import { Toast } from '../components/Toast';
import { Dialog, DialogType, DialogButton } from '../components/Dialog';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showDialog: (
    title: string,
    message: string,
    buttons: DialogButton[],
    type?: DialogType
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);
  const [dialogType, setDialogType] = useState<DialogType>('confirm');

  const showToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const showDialog = (
    title: string,
    message: string,
    buttons: DialogButton[],
    type: DialogType = 'confirm'
  ) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogType(type);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, showDialog }}>
      {children}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
      />
      <Dialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        type={dialogType}
        onDismiss={hideDialog}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 