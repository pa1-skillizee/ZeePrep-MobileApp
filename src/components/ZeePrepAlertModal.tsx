import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { useAlertStore, AlertButton, AlertType } from "../stores/alert-store";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react-native";

export function ZeePrepAlertModal() {
  const { visible, title, message, buttons, type, hideAlert } = useAlertStore();

  if (!visible) return null;

  const renderIcon = () => {
    switch (type) {
      case "error":
        return <XCircle size={32} color="#EF4444" />;
      case "warning":
        return <AlertTriangle size={32} color="#F59E0B" />;
      case "success":
        return <CheckCircle2 size={32} color="#10B981" />;
      case "info":
      default:
        return <Info size={32} color="#4F46E5" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case "error":
        return "#FEF2F2";
      case "warning":
        return "#FFFBEB";
      case "success":
        return "#ECFDF5";
      case "info":
      default:
        return "#EEF2FF";
    }
  };

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert();
    if (btn.onPress) {
      btn.onPress();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <TouchableWithoutFeedback onPress={hideAlert}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={[styles.iconWrapper, { backgroundColor: getHeaderBg() }]}>
                {renderIcon()}
              </View>

              <Text style={styles.titleText}>{title}</Text>
              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              <View
                style={[
                  styles.buttonRow,
                  buttons.length > 2 && styles.buttonColumn,
                ]}
              >
                {buttons.map((btn, index) => {
                  const isDestructive = btn.style === "destructive";
                  const isCancel = btn.style === "cancel";

                  let btnStyle = styles.defaultBtn;
                  let textStyle = styles.defaultBtnText;

                  if (isDestructive) {
                    btnStyle = styles.destructiveBtn;
                    textStyle = styles.destructiveBtnText;
                  } else if (isCancel) {
                    btnStyle = styles.cancelBtn;
                    textStyle = styles.cancelBtnText;
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.baseBtn,
                        btnStyle,
                        buttons.length <= 2 && { flex: 1 },
                      ]}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.baseBtnText, textStyle]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  titleText: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 13.5,
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  buttonColumn: {
    flexDirection: "column",
  },
  baseBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  baseBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  defaultBtn: {
    backgroundColor: "#4F46E5",
  },
  defaultBtnText: {
    color: "#FFFFFF",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: {
    color: "#475569",
  },
  destructiveBtn: {
    backgroundColor: "#DC2626",
  },
  destructiveBtnText: {
    color: "#FFFFFF",
  },
});
