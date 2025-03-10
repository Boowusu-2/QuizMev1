import React, { useState, useEffect } from 'react';
import {
  Text,
  Button,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View
} from 'react-native';
import dgram from 'react-native-udp';
import { NetworkInfo } from 'react-native-network-info';
import { Buffer } from 'buffer';
import Sound from 'react-native-sound';

// Set the playback category
Sound.setCategory('Playback');

// Mapping from Team names to their corresponding sound files
const soundMapping: { [key: string]: string } = {
  "Team 1": "sound1.mp3",
  "Team 2": "sound2.mp3",
  "Team 3": "sound3.mp3",
  "Team 4": "sound4.mp3",
  "Team 5": "sound5.mp3",
  "Team 6": "sound6.mp3",
};

// Helper function to play a sound by filename.
// Creates a new instance each time to allow overlapping playback.
const playSound = (fileName: string) => {
  const soundInstance = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
    if (error) {
      console.log('Failed to load sound:', error);
      return;
    }
    soundInstance.play((success) => {
      if (!success) {
        console.log('Playback failed for', fileName);
      }
      // Release the audio resource after playback.
      soundInstance.release();
    });
  });
};

// Define an interface for the UDP socket
interface UDPSocket {
  bind: (port: number, callback?: () => void) => void;
  send: (
    buffer: Buffer,
    offset: number,
    length: number,
    port: number,
    address: string,
    callback: (error?: Error) => void
  ) => void;
  close: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  address: () => { address: string; port: number; family: string };
  setBroadcast?: (flag: boolean, callback?: (error?: Error) => void) => void;
}

export default function App() {
  const [isServer, setIsServer] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [socket, setSocket] = useState<UDPSocket | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  // List of rings received by the server
  const [clientMessages, setClientMessages] = useState<
    { name: string; timestamp: number }[]
  >([]);
  // For client mode
  const [serverIp, setServerIp] = useState<string>('192.168.1.1');
  const [teamName, setTeamName] = useState<string>('');
  const [hasRung, setHasRung] = useState<boolean>(false);

  useEffect(() => {
    // Get the device's local IP address
    const fetchIpAddress = async () => {
      const ip = await NetworkInfo.getIPV4Address();
      setIpAddress(ip || '');
    };
    fetchIpAddress();

    // Create a new UDP socket
    const newSocket: UDPSocket = dgram.createSocket({ type: 'udp4' });

    if (isServer) {
      // Server configuration
      newSocket.on('listening', () => {
        if (newSocket.setBroadcast) {
          newSocket.setBroadcast(true, (error?: Error) => {
            if (error) {
              console.log('Broadcast enable error:', error);
            } else {
              console.log('Broadcast enabled successfully.');
            }
          });
        }
        const address = newSocket.address();
        setConnectionStatus(`Server listening on port ${address.port}`);
      });

      newSocket.on('message', (data: Buffer, rinfo: any) => {
        const receivedText = data.toString();
        console.log('Server received message:', receivedText);
        if (receivedText === 'reset') {
          console.log('Reset command received on server');
        } else {
          // If the received message matches one of the college names,
          // play the corresponding sound.
          if (soundMapping[receivedText]) {
            playSound(soundMapping[receivedText]);
          }
          // Append the message with a timestamp
          const timestamp = Date.now();
          setClientMessages((prev) => [...prev, { name: receivedText, timestamp }]);
          // Optionally send a reply back to the client
          const reply = Buffer.from('Received');
          newSocket.send(reply, 0, reply.length, rinfo.port, rinfo.address, (error?: Error) => {
            if (error) {
              console.log('Message send error:', error);
            }
          });
        }
      });

      // Bind the server socket to port 8888
      newSocket.bind(8888);
    } else {
      // Client configuration
      newSocket.on('listening', () => {
        console.log('Client socket bound to port 8887');
      });

      newSocket.on('message', (msg: Buffer, _rinfo: any) => {
        const receivedMsg = msg.toString();
        if (receivedMsg === 'reset') {
          setHasRung(false);
          console.log('Reset command received on client');
        } else {
          console.log('Client received message:', receivedMsg);
        }
      });

      // Bind the client socket to port 8887
      newSocket.bind(8887);
    }

    setSocket(newSocket);

    // // Cleanup the socket on unmount or when switching modes
    // return () => {
    //   newSocket.close();
    // };
  }, [isServer]);

  // Client sends team name to server
  const sendMessage = () => {
    if (isServer || !socket) return;
    if (teamName.trim() === '') return;

    const messageBuffer = Buffer.from(teamName);
    socket.send(
      messageBuffer,
      0,
      messageBuffer.length,
      8888, // server port
      serverIp,
      (error?: Error) => {
        if (error) {
          console.log('Send error:', error);
        } else {
          setHasRung(true);
          setTimeout(() => {
            setHasRung(false);
          }, 5000); // re-enable after 10 seconds
        }
      }
    );
  };

  // Server function to reset the round.
  // This also uses a broadcast to notify clients.
  const resetRound = () => {
    if (!socket || !isServer) return;
    setClientMessages([]);
    const resetBuffer = Buffer.from('reset');
    // Adjust the broadcast address as per your network configuration.
    const broadcastAddress = '192.168.1.255';
    socket.send(
      resetBuffer,
      0,
      resetBuffer.length,
      8887, // client port
      broadcastAddress,
      (error?: Error) => {
        if (error) {
          console.log('Reset message send error:', error);
        } else {
          console.log('Reset command sent to clients.');
        }
      }
    );
  };

  // Sort messages so the earliest ring appears on top
  const sortedMessages = [...clientMessages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>✍🏽 Quiz Me 🧠</Text>
      <Text style={styles.text}>🔥🤟🏽Powered By Project55🫴🏿🔥</Text>
      <Text style={styles.statusText}>{connectionStatus}</Text>
      <Button
        title={isServer ? 'Switch to Client Mode' : 'Switch to Server Mode'}
        onPress={() => {
          setIsServer(!isServer);
          setClientMessages([]);
          setHasRung(false);
        }}
      />
      {isServer ? (
        <>
          <Text style={styles.headerGreen}>Your IP: {ipAddress}</Text>
          <Text style={styles.text}>Share above IP with contestants.</Text>
          <Text style={styles.headerText}>Received Rings:</Text>
          {sortedMessages.map((msg, index) => (
            <View style={styles.ringContainer}>
                <Text key={index} style={styles.text}>
              {index + 1}. {msg.name} – {new Date(msg.timestamp).toLocaleTimeString()}
            </Text>
            </View>
          
          ))}
          <Button title="Reset Round" onPress={resetRound} />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setServerIp(text)}
            value={serverIp}
            placeholder="Enter server IP"
            placeholderTextColor="#ccc"
          />
          <TextInput
            style={styles.input}
            onChangeText={(text) => setTeamName(text)}
            value={teamName}
            placeholder="Enter your Team Name"
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity
            onPress={() => {
              if (!hasRung) {
                console.log('Ring button pressed');
                sendMessage();
              }
            }}
            disabled={hasRung}
            style={hasRung ? styles.disabledButton : styles.button}
          >
            <Text style={styles.ringEmoji}>🛎️</Text>
            <Text style={styles.ringText}>
              {hasRung ? "You've Rung!" : 'Ring'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.text,{color: "red",fontSize: 12}]}>⚠️ Do not Modify any Text During the Quiz ⚠️</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#121212',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 4,
    color: 'white',
  },
  text: {
    color: 'white',
    padding: 10,
    fontWeight: "900", 
    fontSize: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 35,
    fontWeight: '900',
    fontFamily: 'Comic Sans MS',
    textAlign: 'center',
  },
  statusText: {
    color: 'lightgray',
    marginVertical: 5,
  },
  headerGreen: {
    color: 'green',
    fontSize: 25,
    margin: 30,
    textAlign: 'center',
  },
  button: {
    width: 320,
    height: 320,
    backgroundColor: 'green',
    borderRadius: 160,
    margin: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'white',
  },
  disabledButton: {
    width: 320,
    height: 320,
    backgroundColor: 'gray',
    borderRadius: 160,
    margin: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'white',
    opacity: 0.6,
  },
  ringEmoji: {
    fontSize: 60,
    fontWeight: 'bold',
  },
  ringText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  ringContainer: {
    width:300,
    height: 80,
    backgroundColor: "#097021FF",
    margin:10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
