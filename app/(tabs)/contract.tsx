import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import ErrorBoundary from "@/components/ErrorBoundary";
import InputField from "@/components/InputField";
import TagToggle from "@/components/TagToggle";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";
import { BadgeCheck, FileText, RotateCcw, IdCard, Briefcase } from "lucide-react-native";
import { ContractFormData } from "@/types/contract";
import { applyParsedToState, initialContractData, parseContractSource } from "@/utils/contractParser";


export default function ContractScreen() {
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<string>(defaultSource);
  const [data, setData] = useState<ContractFormData>(initialContractData());
  const [aiFilled, setAiFilled] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const onFillAI = useCallback(() => {
    try {
      const parsed = parseContractSource(source);
      const next = applyParsedToState(data, parsed);
      if (parsed.summaryLines.length && !next.summary) {
        next.summary = parsed.summaryLines.join("\n");
      }
      setData(next);
      setAiFilled(true);
    } catch (e) {
      console.log("onFillAI error", e);
      throw e;
    }
  }, [source, data]);

  const onUpdateSource = useCallback((newSource: string) => {
    setSource(newSource);
  }, []);

  const onReset = useCallback(() => {
    setData(initialContractData());
    setAiFilled(false);
  }, []);

  const headerRight = useMemo(
    () => {
      const HeaderRightComponent = () => (
        <View style={styles.headerRightContainer}>
          {aiFilled ? (
            <View style={styles.aiBadge} testID="aiBadge">
              <BadgeCheck color="#A7F3D0" size={14} />
              <Text style={styles.aiBadgeText}>Filled by AI</Text>
            </View>
          ) : null}
        </View>
      );
      HeaderRightComponent.displayName = 'HeaderRightComponent';
      return HeaderRightComponent;
    },
    [aiFilled]
  );

  const onSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 700));
      Alert.alert("Submitted", "Variation submitted for review.");
    } catch (e) {
      Alert.alert("Failed", "Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <ErrorBoundary>
      <>
        <Stack.Screen options={{ title: "Contract Adjustment", headerRight }} />
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} 
          testID="contractScroll"
        >
          <View style={styles.grid}>
            <Card style={styles.panel}>
              <View style={styles.panelHeader}>
                <View style={styles.headerLeft}>
                  <FileText color="#A7F3D0" />
                  <Text style={styles.headerTitle}>Source request</Text>
                </View>
                <Text style={styles.caption}>Paste or edit, then fill</Text>
              </View>
              <TextInput
                testID="sourceInput"
                value={source}
                onChangeText={setSource}
                multiline
                numberOfLines={14}
                style={styles.source}
                placeholder="Paste the request here"
                placeholderTextColor="#6B7280"
              />
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={onReset} style={styles.btn} testID="resetAI">
                  <RotateCcw color="#D1D5DB" size={16} />
                  <Text style={styles.btnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.panel}>
              <View style={styles.panelHeader}>
                <View style={styles.headerLeft}>
                  <FileText color="#A7F3D0" />
                  <Text style={styles.headerTitle}>Contract Adjustment Form — AI demo</Text>
                </View>
                {aiFilled ? (
                  <View style={styles.aiBadge}>
                    <BadgeCheck color="#A7F3D0" size={14} />
                    <Text style={styles.aiBadgeText}>Filled by AI</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.row3}>
                <InputField
                  label="Client name"
                  value={data.clientName}
                  onChangeText={(v) => setData({ ...data, clientName: v })}
                  testID="cf-client"
                />
                <InputField
                  label="Site address"
                  value={data.siteAddress}
                  onChangeText={(v) => setData({ ...data, siteAddress: v })}
                  testID="cf-site"
                />
                <InputField label="Date" value={data.date} onChangeText={(v) => setData({ ...data, date: v })} testID="cf-date" />
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>Business unit</Text>
                <View style={styles.tags}>
                  <TagToggle
                    label="ARA Property Services"
                    checked={data.brand === "APS"}
                    onChange={(on) => setData({ ...data, brand: on ? "APS" : null })}
                    testID="chk-ara-ps"
                  />
                  <TagToggle
                    label="ARA Indigenous Services"
                    checked={data.brand === "AIS"}
                    onChange={(on) => setData({ ...data, brand: on ? "AIS" : null })}
                    testID="chk-ara-is"
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>Is this a contract</Text>
                <View style={styles.tags}>
                  <TagToggle
                    label="Start up"
                    checked={data.isStartup}
                    onChange={(on) => setData({ ...data, isStartup: on })}
                    testID="chk-startup"
                  />
                  <TagToggle
                    label="Adjustment"
                    checked={data.isAdjustment}
                    onChange={(on) => setData({ ...data, isAdjustment: on })}
                    testID="chk-adjustment"
                  />
                  <TagToggle
                    label="Termination"
                    checked={data.isTermination}
                    onChange={(on) => setData({ ...data, isTermination: on })}
                    testID="chk-termination"
                  />
                  <TagToggle
                    label="Change in allowed hours"
                    checked={data.isChangeHours}
                    onChange={(on) => setData({ ...data, isChangeHours: on })}
                    testID="chk-change-hours"
                  />
                </View>
              </View>

              <View style={styles.row3}>
                <InputField
                  label="Effective date"
                  value={data.effectiveDate}
                  onChangeText={(v) => setData({ ...data, effectiveDate: v })}
                  testID="cf-effective"
                />
                <InputField
                  label="Account Manager"
                  value={data.accountManager}
                  onChangeText={(v) => setData({ ...data, accountManager: v })}
                  testID="cf-am"
                />
                <InputField label="Zone" value={data.zone} onChangeText={(v) => setData({ ...data, zone: v })} testID="cf-zone" />
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>Summary & instructions</Text>
                <TextInput
                  value={data.summary}
                  onChangeText={(v) => setData({ ...data, summary: v })}
                  multiline
                  numberOfLines={4}
                  style={styles.textarea}
                  placeholder="Notes, instructions, and changes"
                  placeholderTextColor="#6B7280"
                  testID="cf-summary"
                />
              </View>

              <View style={styles.row3}>
                <InputField
                  label="Old contract price"
                  value={data.oldPrice}
                  onChangeText={(v) => setData({ ...data, oldPrice: v })}
                  testID="cf-old-price"
                />
                <InputField
                  label="New contract price"
                  value={data.newPrice}
                  onChangeText={(v) => setData({ ...data, newPrice: v })}
                  testID="cf-new-price"
                />
                <InputField
                  label="New invoice amount (AWB)"
                  value={data.newInvoiceAmount}
                  onChangeText={(v) => setData({ ...data, newInvoiceAmount: v })}
                  testID="cf-new-invoice"
                />
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>September invoice adjustments</Text>
                <TextInput
                  value={data.septemberAdjustments}
                  onChangeText={(v) => setData({ ...data, septemberAdjustments: v })}
                  multiline
                  numberOfLines={3}
                  style={styles.textarea}
                  placeholder="Line items and amounts"
                  placeholderTextColor="#6B7280"
                  testID="cf-sept-adjust"
                />
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>Remodelling note</Text>
                <TextInput
                  value={data.remodellingNote}
                  onChangeText={(v) => setData({ ...data, remodellingNote: v })}
                  multiline
                  numberOfLines={3}
                  style={styles.textarea}
                  placeholder="Remodelling details"
                  placeholderTextColor="#6B7280"
                  testID="cf-remodel"
                />
              </View>

              <View style={styles.subsectionHeader}>
                <IdCard color="#A7F3D0" />
                <Text style={styles.subsectionTitle}>Employee changes</Text>
              </View>

              <View style={styles.tags}>
                <TagToggle
                  label="Employee"
                  checked={data.employeeToggle}
                  onChange={(on) => setData({ ...data, employeeToggle: on })}
                  testID="chk-employee"
                />
                <TagToggle
                  label="Subcontractor"
                  checked={data.subcontractorToggle}
                  onChange={(on) => setData({ ...data, subcontractorToggle: on })}
                  testID="chk-subcontractor"
                />
              </View>

              <View style={styles.row2}>
                <InputField
                  label="Old Employee Name"
                  value={data.oldEmployeeName}
                  onChangeText={(v) => setData({ ...data, oldEmployeeName: v })}
                  testID="cf-old-emp-name"
                />
                <InputField
                  label="Old Mobile"
                  value={data.oldEmployeeMobile}
                  onChangeText={(v) => setData({ ...data, oldEmployeeMobile: v })}
                  testID="cf-old-emp-mobile"
                />
              </View>
              <View style={styles.row2}>
                <InputField
                  label="New Employee Name"
                  value={data.newEmployeeName}
                  onChangeText={(v) => setData({ ...data, newEmployeeName: v })}
                  testID="cf-new-emp-name"
                />
                <InputField
                  label="New Mobile"
                  value={data.newEmployeeMobile}
                  onChangeText={(v) => setData({ ...data, newEmployeeMobile: v })}
                  testID="cf-new-emp-mobile"
                />
              </View>

              <View style={styles.row3}>
                <InputField
                  label="Shift start"
                  value={data.shiftStart}
                  onChangeText={(v) => setData({ ...data, shiftStart: v })}
                  testID="cf-shift-start"
                />
                <InputField
                  label="Shift end"
                  value={data.shiftEnd}
                  onChangeText={(v) => setData({ ...data, shiftEnd: v })}
                  testID="cf-shift-end"
                />
                <View style={styles.contractChangeContainer}>
                  <Text style={styles.label}>Contract change</Text>
                  <TagToggle
                    label="New employment contract required"
                    checked={data.newEmploymentContractRequired}
                    onChange={(on) => setData({ ...data, newEmploymentContractRequired: on })}
                    testID="chk-new-contract"
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>Days</Text>
                <View style={styles.tagsWrap}>
                  <TagToggle
                    label="Mon"
                    checked={data.days.mon}
                    onChange={(on) => setData({ ...data, days: { ...data.days, mon: on } })}
                    testID="day-mon"
                  />
                  <TagToggle
                    label="Tue"
                    checked={data.days.tue}
                    onChange={(on) => setData({ ...data, days: { ...data.days, tue: on } })}
                    testID="day-tue"
                  />
                  <TagToggle
                    label="Wed"
                    checked={data.days.wed}
                    onChange={(on) => setData({ ...data, days: { ...data.days, wed: on } })}
                    testID="day-wed"
                  />
                  <TagToggle
                    label="Thu"
                    checked={data.days.thu}
                    onChange={(on) => setData({ ...data, days: { ...data.days, thu: on } })}
                    testID="day-thu"
                  />
                  <TagToggle
                    label="Fri"
                    checked={data.days.fri}
                    onChange={(on) => setData({ ...data, days: { ...data.days, fri: on } })}
                    testID="day-fri"
                  />
                  <TagToggle
                    label="Sat"
                    checked={data.days.sat}
                    onChange={(on) => setData({ ...data, days: { ...data.days, sat: on } })}
                    testID="day-sat"
                  />
                  <TagToggle
                    label="Sun"
                    checked={data.days.sun}
                    onChange={(on) => setData({ ...data, days: { ...data.days, sun: on } })}
                    testID="day-sun"
                  />
                </View>
              </View>

              <View style={styles.subsectionHeader}>
                <Briefcase color="#A7F3D0" />
                <Text style={styles.subsectionTitle}>Subcontractor changes</Text>
              </View>

              <View style={styles.row2}>
                <InputField
                  label="Old supplier name"
                  value={data.oldSupplierName}
                  onChangeText={(v) => setData({ ...data, oldSupplierName: v })}
                  testID="cf-old-supp-name"
                />
                <InputField
                  label="New supplier name"
                  value={data.newSupplierName}
                  onChangeText={(v) => setData({ ...data, newSupplierName: v })}
                  testID="cf-new-supp-name"
                />
              </View>
              <View style={styles.row2}>
                <InputField
                  label="New supplier phone"
                  value={data.newSupplierPhone}
                  onChangeText={(v) => setData({ ...data, newSupplierPhone: v })}
                  keyboardType="phone-pad"
                  testID="cf-new-supp-phone"
                />
                <InputField
                  label="New supplier email"
                  value={data.newSupplierEmail}
                  onChangeText={(v) => setData({ ...data, newSupplierEmail: v })}
                  keyboardType="email-address"
                  testID="cf-new-supp-email"
                />
              </View>

              <View style={styles.row3}>
                <View style={styles.contractChangeContainer}>
                  <Text style={styles.label}>Materials supplied by ARA</Text>
                  <View style={styles.tags}>
                    <TagToggle
                      label="Yes"
                      checked={data.materialsYes}
                      onChange={(on) => setData({ ...data, materialsYes: on, materialsNo: on ? false : data.materialsNo })}
                      testID="chk-mats-yes"
                    />
                    <TagToggle
                      label="No"
                      checked={data.materialsNo}
                      onChange={(on) => setData({ ...data, materialsNo: on, materialsYes: on ? false : data.materialsYes })}
                      testID="chk-mats-no"
                    />
                  </View>
                </View>
                <InputField
                  label="If yes, budget"
                  value={data.materialsBudget}
                  onChangeText={(v) => setData({ ...data, materialsBudget: v })}
                  testID="cf-mats-budget"
                />
                <View style={styles.contractChangeContainer}>
                  <Text style={styles.label}>Suppliers Cost</Text>
                  <View style={styles.tags}>
                    <TagToggle
                      label="PCM"
                      checked={data.supplierCostPCM}
                      onChange={(on) => setData({ ...data, supplierCostPCM: on, supplierCostPA: on ? false : data.supplierCostPA })}
                      testID="chk-cost-pcm"
                    />
                    <TagToggle
                      label="PA"
                      checked={data.supplierCostPA}
                      onChange={(on) => setData({ ...data, supplierCostPA: on, supplierCostPCM: on ? false : data.supplierCostPCM })}
                      testID="chk-cost-pa"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row3}>
                <InputField
                  label="Monthly cost"
                  value={data.monthlyCost}
                  onChangeText={(v) => setData({ ...data, monthlyCost: v })}
                  testID="cf-monthly-cost"
                />
                <InputField
                  label="Annualised"
                  value={data.annualised}
                  onChangeText={(v) => setData({ ...data, annualised: v })}
                  testID="cf-annualised"
                />
                <InputField
                  label="Actual days"
                  value={data.actualDays}
                  onChangeText={(v) => setData({ ...data, actualDays: v })}
                  testID="cf-actual-days"
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.btn} onPress={() => {}} testID="saveDraft">
                  <Text style={styles.btnText}>Save draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={onSubmit} disabled={submitting} testID="submitVariation">
                  <Text style={styles.btnPrimaryText}>{submitting ? "Submitting..." : "Submit variation"}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </ScrollView>
        
        <FloatingAIAssistant 
          contractData={{
            source,
            formData: data,
            onFillAI,
            onUpdateSource,
          }}
          testID="contractAIAssistant"
        />
      </>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, gap: 12 },
  grid: { gap: 12 },
  panel: { gap: 12 },
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#E5E7EB", fontSize: 14, fontWeight: "600" },
  caption: { color: "#9CA3AF", fontSize: 12 },
  source: {
    minHeight: 300,
    padding: 12,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    color: "#E5E7EB",
    fontSize: 13,
    textAlignVertical: "top",
  },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnText: { color: "#D1D5DB", fontSize: 13, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnPrimaryText: { color: "#D1FAE5", fontSize: 13, fontWeight: "700" },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.30)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: { color: "#D1FAE5", fontSize: 12, fontWeight: "600" },
  block: { marginBottom: 8 },
  label: { fontSize: 12, color: "#9CA3AF", marginBottom: 6 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row2: { flexDirection: "row", gap: 12 },
  row3: { flexDirection: "row", gap: 12 },
  textarea: {
    minHeight: 96,
    padding: 12,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    color: "#E5E7EB",
    fontSize: 13,
    textAlignVertical: "top",
  },
  subsectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 6 },
  subsectionTitle: { color: "#E5E7EB", fontSize: 13, fontWeight: "700" },
  formActions: { marginTop: 6, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  headerRightContainer: { flexDirection: "row", gap: 8, paddingRight: 6 },
  contractChangeContainer: { marginBottom: 12 },
  materialsContainer: { marginBottom: 12 },
  supplierCostContainer: { marginBottom: 12 },
});

const defaultSource =
  "Client name:      Air Services Australia - ACT\nSite Address:     ALAN WOODS BUILDING – CANBERRA\tDate:  29/8/25\nARA Property Services  ☐    ARA Indigenous Services ☒\nIs this a contract:\nStart up ☐  Adjustment ☒    Termination ☐    Change in allowed hours ☐\nEFFECTIVE 15/9/25\n\nTermination of day cleaning service – effective 15/9/25 remove this invoice from list of charges.\n\nNew invoice amount per month for AWB - $19,705.68 plus gst\n\nSeptember invoice adjustments\nDay Cleaning               pro rata invoice for 1/9/25 to 12/9/25 - $3,734.84 plus gst\nNight Cleaning            pro rata invoice for 1/9/25 to 12/9/25 - $6,664.37 plus gst\nFrom 15/9 to 30/9     pro rata invoice for 15/9 to 30/9 - $15,461.38 plus gst\n\nRemodelling (see attached excel) allows for 18.71hrs per day @$48.61/hr.  Only 12hrs per day will be used.\n\nDay Cleaner Karma Tshulthrin – change from FT to PT effective 15/9/25\nNew shift 16:00 – 20:00 Monday to Friday\nNew employment contract required\nUpdate of timegate required\nThe other 2 employees on this roster do not change\n\nOld contract price:\t\t\t\t\tAccount Manager:  Jasmina\nNew contract price: \t$19,705.68 plus gst\t\tZone: ACT\nDate change will take effect:  15/9/25\nEmployee ☐\nOld Employee Name:\t\t\t\t\t\tMobile no: \nNew Employee Name:  \t\tKarma Tshulthrin\t\t\tMobile no: \nOld Employee hours:  Mon ☐ \tTue ☐\t Wed ☐ \t Thu ☐ \tFri ☐ \tSat ☐\t Sun ☐\nNew Employee hours:  Mon ☒  Tue ☒\t Wed ☒\t Thu ☒\tFri ☒\tSat ☐\t Sun ☐\nSubcontractor ☐\nMonthly Cost: Annualised:          \t\t\t\t\t\tActual Days:\nMaterials supplied by ARA: Yes/No           \t\t\t\tIf yes, budget:\nOld Supplier name:\nNew Supplier name:\nOld Supplier hours: Mon ☐ \tTue ☐\t Wed ☐ \t Thu ☐ \tFri ☐ \tSat ☐\t Sun ☐\nNew Supplier hours: Mon ☐  Tue ☐\t Wed ☐\t Thu ☐\tFri ☐\tSat ☐\t Sun ☐\nNew Supplier phone:\nNew Supplier email:\nSuppliers Cost: PCM ☐   PA ☐\nCopy of approval/pricing/quote (variation will not be processed without written approval):";