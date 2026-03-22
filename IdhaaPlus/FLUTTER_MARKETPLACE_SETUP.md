# Multi-Vendor Marketplace Mobile App (Flutter & Firebase)

## 1. Tech Stack & Recommended Packages
- **Framework:** Flutter
- **Backend:** Firebase (Authentication, Firestore, Storage, Cloud Messaging)
- **State Management:** Riverpod (or BLoC)
- **Routing:** go_router
- **Localization (RTL/Arabic):** flutter_localizations, intl
- **UI Architecture:** Clean Architecture
- **Push Notifications:** firebase_messaging
- **Image Picker:** image_picker
- **Location/Maps:** geolocator, geocoding

## 2. Setup Instructions

### Initial Project Creation
```bash
# Create the Flutter project
flutter create --org com.yourcompany marketplace_app
cd marketplace_app

# Add required dependencies
flutter pub add firebase_core firebase_auth cloud_firestore firebase_storage firebase_messaging
flutter pub add flutter_riverpod riverpod_annotation
flutter pub add go_router
flutter pub add intl flutter_localizations --dev
flutter pub add image_picker cached_network_image
flutter pub add dartz freezable json_annotation
```

### RTL & Arabic Localization Setup
1. In `pubspec.yaml`, ensure you have:
```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.1
```
2. In your `MaterialApp`, add:
```dart
MaterialApp(
  localizationsDelegates: const [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ],
  supportedLocales: const [
    Locale('ar', 'AE'), // Arabic
  ],
  locale: const Locale('ar', 'AE'),
  // ...
)
```

### Firebase Setup
1. Install FlutterFire CLI: `dart pub global activate flutterfire_cli`
2. Configure Firebase: `flutterfire configure`
3. Initialize Firebase in `main.dart`:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: MyApp()));
}
```

---

## 3. Clean Architecture Folder Structure

```text
lib/
├── core/                       # Shared across all features
│   ├── constants/              # App constants, colors, themes, API keys
│   ├── errors/                 # Exception and Failure classes
│   ├── network/                # Network info, Firebase instances
│   ├── router/                 # go_router configuration
│   └── utils/                  # Helper functions, formatters
├── features/
│   ├── auth/                   # Phone Auth Feature
│   │   ├── data/
│   │   │   ├── models/         # Firebase DTOs
│   │   │   ├── data_sources/   # Firebase Auth calls
│   │   │   └── repositories/   # Repository implementation
│   │   ├── domain/
│   │   │   ├── entities/       # Business logic objects
│   │   │   ├── repositories/   # Interfaces
│   │   │   └── usecases/       # Use cases (e.g., VerifyPhone, Login)
│   │   └── presentation/
│   │       ├── providers/      # Riverpod/BLoC state
│   │       ├── pages/          # Screens (Login, OTP)
│   │       └── widgets/        # Auth specific widgets
│   ├── customer/               # Customer specific features
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── products/
│   │   └── profile/
│   ├── seller/                 # Seller panel features
│   │   ├── inventory/
│   │   ├── orders/
│   │   └── profile/
│   └── admin/                  # Admin features (if integrated in same app)
│       ├── approvals/
│       ├── dashboard/
│       └── commission/
└── main.dart
```

---

## 4. Firebase Firestore Schema

### `Users` Collection
```json
{
  "uid": "string",
  "phone": "string",
  "role": "customer | seller | admin",
  "name": "string",
  "addresses": [
    {
      "city": "string",
      "area": "string",
      "street": "string",
      "contactPhone": "string"
    }
  ],
  "createdAt": "timestamp"
}
```

### `Sellers` Collection
```json
{
  "sellerId": "string (matches uid)",
  "storeName": "string",
  "status": "pending | approved | rejected",
  "commissionRate": "number (e.g., 0.10)",
  "createdAt": "timestamp"
}
```

### `Products` Collection
```json
{
  "productId": "string",
  "sellerId": "string",
  "categoryId": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "images": ["string (URLs)"],
  "stock": "number",
  "isApproved": "boolean",
  "createdAt": "timestamp"
}
```

### `Categories` Collection
```json
{
  "categoryId": "string",
  "name": "string",
  "imageUrl": "string",
  "isActive": "boolean"
}
```

### `Orders` Collection
```json
{
  "orderId": "string",
  "customerId": "string",
  "sellerId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": "number",
      "priceAtPurchase": "number"
    }
  ],
  "totalAmount": "number",
  "status": "Pending | Confirmed | Preparing | Out for Delivery | Delivered | Paid",
  "shippingAddress": {
    "city": "string",
    "area": "string",
    "street": "string",
    "phone": "string"
  },
  "paymentMethod": "COD",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `Reviews` Collection
```json
{
  "reviewId": "string",
  "productId": "string",
  "customerId": "string",
  "rating": "number (1-5)",
  "comment": "string",
  "createdAt": "timestamp"
}
```

### `Notifications` Collection
```json
{
  "notificationId": "string",
  "userId": "string",
  "title": "string",
  "body": "string",
  "isRead": "boolean",
  "createdAt": "timestamp"
}
```

---

## 5. Order Status Flow
1. **Pending:** Order placed by customer (COD).
2. **Confirmed:** Seller accepts the order.
3. **Preparing:** Seller is preparing the items.
4. **Out for Delivery:** Handed over to manual courier.
5. **Delivered:** Courier drops it off at the customer's address.
6. **Paid:** Cash collected and remitted back to the system/seller.

## 6. Security Rules (Firestore Rules Draft)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admins can do anything
    function isAdmin() {
      return get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sellers can manage their own products and see assigned orders
    function isSeller() {
      return get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'seller';
    }
    
    match /Users/{userId} {
      allow read, write: if request.auth.uid == userId || isAdmin();
    }
    
    match /Products/{productId} {
      allow read: if true; // Everyone can read products
      allow write: if isSeller() && request.resource.data.sellerId == request.auth.uid || isAdmin();
    }
    
    match /Orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.customerId 
                  || request.auth.uid == resource.data.sellerId 
                  || isAdmin();
      allow update: if request.auth.uid == resource.data.sellerId || isAdmin();
    }
  }
}
```