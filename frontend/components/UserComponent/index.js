import React, { useState, useEffect } from 'react';
import { Alert, View, StyleSheet, Text, TouchableOpacity, Dimensions, TextInput, Image, ActionSheetIOS } from 'react-native';
import * as Updates from 'expo-updates';
import * as ImagePicker from 'expo-image-picker';

import SecureStorageManager from '../../storage';

const UserDetailComponent = ({ navigation }) => {
  const [authToken, setAuthToken] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(require('../../assets/profile.png'));

  const secureStorage = SecureStorageManager.getInstance();

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await secureStorage.get('authToken');
        setAuthToken(token);

        const name = await secureStorage.get('userName');
        setUserName(name);

        const email = await secureStorage.get('userEmail');
        setUserEmail(email);

        const imageUri = await secureStorage.get('profileImage');
        if (imageUri) {
          setProfileImage({uri: JSON.parse(imageUri) });
        }
      } catch (error) {
        console.log('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogOut = async () => {
    try {
      await secureStorage.delete('authToken');
      await secureStorage.delete('userName');
      await secureStorage.delete('userEmail');
      await secureStorage.delete('detectedLandmark');
      await secureStorage.delete('profileImage');
      await Updates.reloadAsync();
    } catch (error) {
      console.error(error);
      Alert.alert("Login Error", "An unexpected error occurred.");
    }
  };

  const handleProfileImage = async () => {
    const options = ['Cancel', 'Take Photo', 'Choose from Library'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 1) {
          let result = await ImagePicker.launchCameraAsync();
          if (!result.cancelled) {
            setProfileImage({uri: result.assets[0].uri});
            await secureStorage.put('profileImage', JSON.stringify(result.assets[0].uri));
          }
        } else if (buttonIndex === 2) {
          let result = await ImagePicker.launchImageLibraryAsync();
          if (!result.cancelled) {
            setProfileImage({uri: result.assets[0].uri});
            await secureStorage.put('profileImage', JSON.stringify(result.assets[0].uri));
          }
        }
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleProfileImage}>
        <Image source={profileImage} style={styles.profileImage} />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
        placeholder="Name"
        placeholderTextColor="#999"
        autoCapitalize="none"
        returnKeyType="done"
      />
      <TextInput
        style={styles.input}
        value={userEmail}
        editable={false}
      />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleLogOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#f2e7d6',
  },
  profileImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    marginBottom: 30,
  },
  input: {
    fontSize: 16,
    width: windowWidth * 0.65,
    backgroundColor: 'white',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonContainer: {
    backgroundColor: '#729c70',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UserDetailComponent;