import { useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { isOptedOut, setOptOut } from "../lib/analytics";
import { Purple } from "../utils/Colors";

export function UsageDataToggle() {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(true);
  // Guards against the initial fetch resolving after (and clobbering) a
  // manual toggle the user made before it settled.
  const interactedRef = useRef(false);
  const label = t("account.shareUsageData");

  useEffect(() => {
    let cancelled = false;
    void isOptedOut().then((out) => {
      if (!cancelled && !interactedRef.current) setSharing(!out);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onChange(next: boolean) {
    interactedRef.current = true;
    setSharing(next);
    await setOptOut(!next);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("account.privacy")}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.help}>{t("account.shareUsageDataHelp")}</Text>
          </View>
          <Switch
            accessibilityLabel={label}
            value={sharing}
            onValueChange={(value) => void onChange(value)}
            trackColor={{ false: "rgba(255,255,255,0.35)", true: "#FFFFFF" }}
            thumbColor={sharing ? Purple : "#f4f3f4"}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  copy: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  help: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
  },
});
