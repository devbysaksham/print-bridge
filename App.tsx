import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  USBPrinter,
} from '@haroldtran/react-native-thermal-printer';

type USBPrinterDevice = {
  device_name?: string;
  vendor_id?: string;
  product_id?: string;
  deviceId?: string;
  vendorId?: string;
  productId?: string;
};

export default function App() {
  const [devices, setDevices] = useState<USBPrinterDevice[]>([]);
  const [selected, setSelected] = useState<USBPrinterDevice | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [status, setStatus] = useState('Printer not detected');

  useEffect(() => {
    initializeUSB();
  }, []);

  async function initializeUSB() {
    try {
      setLoading(true);
      setStatus('Initializing USB...');

      await USBPrinter.init();

      await detectPrinters();
    } catch (error: any) {
      console.log('USB INIT ERROR:', error);

      setStatus(
        error?.message || 'Unable to initialize USB printer service',
      );
    } finally {
      setLoading(false);
    }
  }

  async function detectPrinters() {
    try {
      setLoading(true);
      setStatus('Detecting USB printers...');

      const result = await USBPrinter.getDeviceList();

      console.log('USB DEVICES:', result);

      const list = Array.isArray(result) ? result : [];

      setDevices(list);

      if (list.length === 0) {
        setSelected(null);
        setConnected(false);
        setStatus('No USB printer detected');
        return;
      }

      setSelected(list[0]);
      setStatus(`${list.length} USB printer detected`);
    } catch (error: any) {
      console.log('USB DETECTION ERROR:', error);

      setDevices([]);
      setSelected(null);
      setConnected(false);

      setStatus(
        error?.message || 'USB printer detection failed',
      );
    } finally {
      setLoading(false);
    }
  }

  async function connectPrinter(device: USBPrinterDevice) {
    try {
      setLoading(true);
      setStatus('Connecting to printer...');

      const vendorId =
        device.vendor_id ||
        device.vendorId ||
        '';

      const productId =
        device.product_id ||
        device.productId ||
        '';

      if (!vendorId || !productId) {
        throw new Error(
          'Printer Vendor ID or Product ID not found.',
        );
      }

      await USBPrinter.connectPrinter(
        String(vendorId),
        String(productId),
      );

      setSelected(device);
      setConnected(true);
      setStatus('Printer connected successfully');
    } catch (error: any) {
      console.log('USB CONNECT ERROR:', error);

      setConnected(false);

      Alert.alert(
        'Connection Failed',
        error?.message || 'Unable to connect to printer',
      );

      setStatus('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function testPrint() {
    if (!selected) {
      Alert.alert(
        'No Printer',
        'Please detect and select a USB printer first.',
      );
      return;
    }

    if (!connected) {
      Alert.alert(
        'Printer Not Connected',
        'Please connect the printer first.',
      );
      return;
    }

    try {
      setPrinting(true);
      setStatus('Sending test print...');

      const receipt =
        '\x1B\x40' +
        '\x1B\x61\x01' +
        '\x1B\x45\x01' +
        'ZOVIX POS\n' +
        '\x1B\x45\x00' +
        'USB PRINTER TEST\n' +
        '------------------------------\n' +
        '\x1B\x61\x00' +
        'Connection : USB OTG\n' +
        'Status     : Connected\n' +
        'Printer    : ' +
        (selected.device_name || 'USB Printer') +
        '\n' +
        '------------------------------\n' +
        '\x1B\x61\x01' +
        '\x1B\x45\x01' +
        'TEST PRINT SUCCESSFUL\n' +
        '\x1B\x45\x00' +
        '\n\n\n' +
        '\x1D\x56\x00';

      await USBPrinter.printRaw(receipt);

      setStatus('Test print successful');

      Alert.alert(
        'Success',
        'Test receipt sent to the USB printer.',
      );
    } catch (error: any) {
      console.log('PRINT ERROR:', error);

      setStatus('Test print failed');

      Alert.alert(
        'Print Failed',
        error?.message || 'Unable to print test receipt',
      );
    } finally {
      setPrinting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#080808"
      />

      <ScrollView
        contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.logo}>ZOVIX</Text>
          <Text style={styles.subtitle}>
            USB THERMAL PRINTER TEST
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusDot,
              connected
                ? styles.connectedDot
                : styles.disconnectedDot,
            ]}
          />

          <View style={styles.statusTextBox}>
            <Text style={styles.statusTitle}>
              {connected
                ? 'Printer Connected'
                : 'Printer Not Connected'}
            </Text>

            <Text style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detectButton}
          onPress={detectPrinters}
          disabled={loading}>

          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              DETECT USB PRINTER
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          DETECTED PRINTERS
        </Text>

        {devices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No USB printer found
            </Text>

            <Text style={styles.emptyText}>
              Connect your thermal printer using an OTG
              cable and tap Detect USB Printer.
            </Text>
          </View>
        ) : (
          devices.map((device, index) => {

            const vendorId =
              device.vendor_id ||
              device.vendorId ||
              '-';

            const productId =
              device.product_id ||
              device.productId ||
              '-';

            const isSelected =
              selected === device;

            return (
              <TouchableOpacity
                key={
                  device.deviceId ||
                  `${vendorId}-${productId}-${index}`
                }
                style={[
                  styles.printerCard,
                  isSelected &&
                    styles.selectedPrinterCard,
                ]}
                onPress={() => setSelected(device)}>

                <Text style={styles.printerName}>
                  {device.device_name ||
                    'USB Thermal Printer'}
                </Text>

                <Text style={styles.printerInfo}>
                  Vendor ID: {vendorId}
                </Text>

                <Text style={styles.printerInfo}>
                  Product ID: {productId}
                </Text>

                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() =>
                    connectPrinter(device)
                  }>

                  <Text style={styles.connectText}>
                    {isSelected && connected
                      ? 'CONNECTED'
                      : 'CONNECT'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={styles.sectionTitle}>
          TEST
        </Text>

        <TouchableOpacity
          style={[
            styles.printButton,
            (!connected || printing) &&
              styles.disabledButton,
          ]}
          onPress={testPrint}
          disabled={!connected || printing}>

          {printing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.printText}>
              PRINT TEST RECEIPT
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          ZOVIX POS • USB OTG • ESC/POS
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080808',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginTop: 20,
    marginBottom: 25,
  },

  logo: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
  },

  subtitle: {
    color: '#777777',
    fontSize: 12,
    marginTop: 5,
    letterSpacing: 2,
  },

  statusCard: {
    backgroundColor: '#151515',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  statusDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    marginRight: 13,
  },

  connectedDot: {
    backgroundColor: '#22c55e',
  },

  disconnectedDot: {
    backgroundColor: '#ef4444',
  },

  statusTextBox: {
    flex: 1,
  },

  statusTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  statusText: {
    color: '#888888',
    marginTop: 4,
    fontSize: 12,
  },

  detectButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  sectionTitle: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },

  emptyCard: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  emptyText: {
    color: '#777777',
    marginTop: 8,
    lineHeight: 20,
  },

  printerCard: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },

  selectedPrinterCard: {
    borderWidth: 1,
    borderColor: '#555555',
  },

  printerName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },

  printerInfo: {
    color: '#888888',
    fontSize: 12,
    marginTop: 3,
  },

  connectButton: {
    marginTop: 15,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
  },

  connectText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  printButton: {
    height: 58,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
  },

  disabledButton: {
    backgroundColor: '#303030',
  },

  printText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footer: {
    color: '#444444',
    textAlign: 'center',
    marginTop: 35,
    fontSize: 10,
    letterSpacing: 1,
  },
});