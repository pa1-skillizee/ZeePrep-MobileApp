/**
 * ZeePrep — Report PDF export trigger.
 * Web: prints the shared A4 HTML via browser print window or iframe.
 * Native (APK): opens a full-screen preview with A4 layout and triggers system print / Save as PDF.
 */
import React, { useRef, useState } from "react";
import { Platform, Pressable, Text, StyleSheet, Modal, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { FileText, X } from "lucide-react-native";
import { buildReportHtml } from "../services/report-html";
import type { ReportHtmlInput } from "../services/report-html";
import { ZEEPREP_THEME as TH } from "../constants/theme";

type Props = ReportHtmlInput & { compact?: boolean };

function webPrint(htmlStr: string) {
  try {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlStr);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.warn("[ZeePrep] Print window notice:", e);
        }
      }, 350);
      return;
    }
  } catch (e) {
    // Fallback to iframe below
  }

  try {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
    } as CSSStyleDeclaration);
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    const docu = win?.document;
    if (!docu) return;
    docu.open();
    docu.write(htmlStr);
    docu.close();
    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    };
    setTimeout(() => {
      try {
        win?.focus();
        win?.print();
      } catch (e) {
        console.warn("[ZeePrep] web print failed:", e);
      }
      setTimeout(cleanup, 2000);
    }, 400);
  } catch (e) {
    console.warn("[ZeePrep] web print fallback failed:", e);
  }
}

export default function ReportPdfButton(props: Props) {
  const { compact, ...htmlInput } = props;
  const [open, setOpen] = useState(false);
  const webRef = useRef<WebView>(null);

  const getHtml = () => buildReportHtml(htmlInput);

  const onPress = () => {
    if (Platform.OS === "web") {
      webPrint(getHtml());
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Pressable onPress={onPress} style={[styles.btn, compact && styles.btnCompact]} accessibilityRole="button">
        <FileText size={compact ? 14 : 16} color="#FFFFFF" />
        {!compact && <Text style={styles.btnText}>Download PDF Report</Text>}
      </Pressable>

      {Platform.OS !== "web" && (
        <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Academic Report PDF</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => webRef.current?.injectJavaScript("window.print(); true;")}
                style={styles.printBtn}
              >
                <FileText size={15} color="#FFFFFF" />
                <Text style={styles.printBtnText}>Save / Print PDF</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <X size={20} color={TH.colors.textPrimary} />
              </Pressable>
            </View>
          </View>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: getHtml() }}
            style={{ flex: 1, backgroundColor: "#FFFFFF" }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator style={{ marginTop: 40 }} color={TH.colors.primary} />
            )}
          />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TH.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnCompact: { paddingHorizontal: 10, paddingVertical: 8 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
    borderBottomWidth: 1,
    borderBottomColor: TH.colors.border,
    backgroundColor: TH.colors.surface,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: TH.colors.textPrimary },
  modalActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TH.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  closeBtn: { padding: 6 },
});
