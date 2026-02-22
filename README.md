# Dairy Calculator Mobile App

Mobile app for dairy product sellers.

## Features

- Add dairy products in **Settings**
- Set product name, price, and image
- Home screen shows all products
- Enter quantity for each product and get auto-calculated line total
- Auto-calculates grand total for all products
- Clear button resets all quantities
- Product data is saved locally on device

## Requirements

- Node.js **20.19.4+** (recommended latest LTS)
- npm 10+
- Android phone with Expo Go (for development run) or EAS build install (for APK)

## Run on Android (Development)

1. Install dependencies:
   - `npm install`
2. Start Expo:
   - `npm run start`
3. Press `a` in terminal or scan QR in Expo Go app.

## Build installable Android APK

1. Install EAS CLI:
   - `npm install -g eas-cli`
2. Login to Expo:
   - `eas login`
3. Build APK:
   - `eas build -p android --profile preview`
4. Download APK from Expo build link and install on Android device.

## Build Android Play Store AAB

- `eas build -p android --profile production`

