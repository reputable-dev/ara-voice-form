import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  Bell,
  Settings,
  CheckCircle,
  ClipboardList,
  Clock,
  Droplet,
  Camera,
  Search,
  Upload,
  Download,
  FileText,
  BarChart3,
} from 'lucide-react-native';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  backgroundColor: string;
  onPress: () => void;
}

interface DocumentItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
  <Card style={[styles.statCard, { borderColor: color + '20' }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      {icon}
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </Card>
);

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, backgroundColor, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor }]}>
      {icon}
    </View>
    <Text style={styles.quickActionTitle}>{title}</Text>
  </TouchableOpacity>
);

const DocumentItem: React.FC<DocumentItemProps> = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.documentItem} onPress={onPress}>
    <View style={styles.documentIcon}>
      {icon}
    </View>
    <View style={styles.documentContent}>
      <Text style={styles.documentTitle}>{title}</Text>
      <Text style={styles.documentSubtitle}>{subtitle}</Text>
    </View>
    <TouchableOpacity style={styles.downloadButton}>
      <Download size={20} color={Colors.light.tint} />
    </TouchableOpacity>
  </TouchableOpacity>
);

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressCircle}>
        <View style={styles.progressBackground} />
        <View 
          style={[
            styles.progressForeground,
            {
              transform: [{ rotate: `${(percentage / 100) * 360 - 90}deg` }]
            }
          ]}
        />
      </View>
      <Text style={styles.progressText}>{percentage}%</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  
  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
  };

  const handleDocumentPress = (document: string) => {
    console.log(`Document pressed: ${document}`);
  };

  return (
    <ErrorBoundary>
      <>
        <Stack.Screen
          options={{
            title: "Dashboard",
            headerRight: () => (
              <View style={styles.headerRightContainer}>
                <BarChart3 color={Colors.light.subtle} />
              </View>
            ),
          }}
        />
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          testID="dashboardScroll"
        >
        {/* Header */}
        <Card style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JS</Text>
            </View>
            <View>
              <Text style={styles.userName}>John Smith</Text>
              <Text style={styles.userRole}>Property Manager</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Bell size={24} color={Colors.light.subtle} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Settings size={24} color={Colors.light.subtle} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Main Progress Card */}
        <Card style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <CircularProgress percentage={75} />
            <View style={styles.mainCardInfo}>
              <Text style={styles.mainCardTitle}>Quarterly Maintenance</Text>
              <Text style={styles.mainCardSubtitle}>TechCorp Headquarters</Text>
              <View style={styles.mainCardStats}>
                <View>
                  <Text style={styles.mainCardLabel}>Time Remaining</Text>
                  <Text style={styles.mainCardValue}>1h 45m</Text>
                </View>
                <View>
                  <Text style={styles.mainCardLabel}>Tasks</Text>
                  <Text style={styles.mainCardValue}>18/24</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<CheckCircle size={24} color={Colors.light.success} />}
            title="Tasks Completed"
            value="18"
            color={Colors.light.success}
          />
          <StatCard
            icon={<ClipboardList size={24} color={Colors.light.warning} />}
            title="Tasks Remaining"
            value="6"
            color={Colors.light.warning}
          />
          <StatCard
            icon={<Clock size={24} color="#3B82F6" />}
            title="Time on Site"
            value="6:15"
            color="#3B82F6"
          />
          <StatCard
            icon={<Droplet size={24} color="#8B5CF6" />}
            title="Supplies Used"
            value="12"
            color="#8B5CF6"
          />
        </View>

        {/* Quick Actions */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon={<Camera size={24} color="#FFFFFF" />}
              title="Capture"
              backgroundColor={Colors.light.border}
              onPress={() => handleQuickAction('capture')}
            />
            <QuickAction
              icon={<Search size={24} color="#FFFFFF" />}
              title="Scan"
              backgroundColor={Colors.light.tint}
              onPress={() => handleQuickAction('scan')}
            />
            <QuickAction
              icon={<Upload size={24} color="#FFFFFF" />}
              title="Upload"
              backgroundColor="#3B82F6"
              onPress={() => handleQuickAction('upload')}
            />
          </View>
        </Card>

        {/* Recent Documents */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.documentsList}>
            <DocumentItem
              icon={<FileText size={24} color={Colors.light.tint} />}
              title="TechCorp Maintenance Report.pdf"
              subtitle="Today, 2:30 PM • 1.2 MB"
              onPress={() => handleDocumentPress('maintenance-report')}
            />
            <DocumentItem
              icon={<FileText size={24} color="#3B82F6" />}
              title="Building Inspection Checklist.docx"
              subtitle="Yesterday, 10:15 AM • 845 KB"
              onPress={() => handleDocumentPress('inspection-checklist')}
            />
            <DocumentItem
              icon={<FileText size={24} color={Colors.light.warning} />}
              title="Electrical Systems Guide.pdf"
              subtitle="Mar 15, 2025 • 3.7 MB"
              onPress={() => handleDocumentPress('electrical-guide')}
            />
          </View>
        </Card>
        </ScrollView>
      </>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  headerRightContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userName: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
  },
  userRole: {
    color: Colors.light.subtle,
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  mainCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: Colors.light.border,
  },
  progressForeground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: Colors.light.tint,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressText: {
    position: 'absolute',
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
  },
  mainCardInfo: {
    flex: 1,
  },
  mainCardTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  mainCardSubtitle: {
    color: Colors.light.subtle,
    fontSize: 14,
    marginBottom: 16,
  },
  mainCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainCardLabel: {
    color: Colors.light.subtle,
    fontSize: 12,
    marginBottom: 4,
  },
  mainCardValue: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    color: Colors.light.subtle,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '500',
  },
  documentsList: {
    gap: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentSubtitle: {
    color: Colors.light.subtle,
    fontSize: 12,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

});