import { create } from "zustand";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export type AlertType = "info" | "warning" | "error" | "success" | "request_sent" | string;

export interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  type: AlertType;
  showAlert: (
    title: string,
    message: string,
    buttons?: AlertButton[],
    type?: AlertType
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  buttons: [],
  type: "info",
  showAlert: (title, message, buttons = [{ text: "OK" }], type = "info") =>
    set({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK" }],
      type: type || "info",
    }),
  hideAlert: () =>
    set({ visible: false, title: "", message: "", buttons: [], type: "info" }),
}));

export function showZeeAlert(
  title: string,
  message: string,
  buttons?: AlertButton[],
  type?: AlertType
) {
  useAlertStore.getState().showAlert(title, message, buttons, type);
}

export function hideZeeAlert() {
  useAlertStore.getState().hideAlert();
}
