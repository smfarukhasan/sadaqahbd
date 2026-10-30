# 💳 Khub Soja Payment Gateway — API Integration Guide

Official integration guide for connecting **Khub Soja Payment Gateway (`https://pay.khubsoja.com`)** to external applications, websites, and mobile apps.

---

## 🌐 Base URL & Endpoints

**Production Base URL:** `https://pay.khubsoja.com`  
**Local / Staging Base URL:** `http://192.168.0.106:3000` (or `http://localhost:3000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payment/create-session` | Initialize a checkout session and obtain `checkout_url`. |
| `GET` | `/api/payment/verify/{transaction_id}` | Verify payment status by `transaction_id`. |
| `GET` | `/api/payment/order/{order_id}` | Look up payment status by invoice number or client `order_id`. |
| `POST` | `/api/payment/cancel-session` | Programmatically cancel an in-progress session. |

---

## 📱 App Name & Domain Tracking

The gateway tracks the source application for every transaction:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `app_name` | String | **Required** | The name of your application (e.g., `"MyShop Web"`, `"KhubSoja Android App"`, `"Flutter Firebase Store"`). Displayed on the official customer invoice and recorded in the database. |
| `app_domain` | String | **Web: Optional**<br>**Mobile: Omit / Null** | The web domain where the transaction originates (e.g., `"myshop.com"`).<br><br>💡 **For Mobile Apps (Flutter, Firebase, Android Native, iOS):** Mobile apps do not have a web domain. **Do not send `app_domain`** (or send `null` or pass `"is_mobile": true`). The gateway will store only `app_name` and save `app_domain` as `NULL` in the database. |

---

## 🚀 Integration Workflows

### Method 1: API Session Workflow (Recommended for Production)

This is the standard, secure flow used by Flutter, Android, iOS, and Web applications:

```
[ Your App / Backend ] 
      │
      │ 1. POST /api/payment/create-session
      ▼
[ Khub Soja Gateway ] ── Returns { checkout_url, session_id, order_id, transaction_id }
      │
      │ 2. Open checkout_url in Browser / Chrome Custom Tab / In-App WebView
      ▼
[ Customer Pays via PayStation / MFS / Card ]
      │
      │ 3. Redirects to your return_url with { status, transaction_id, order_id }
      ▼
[ Your App / Backend ]
      │
      │ 4. GET /api/payment/verify/{transaction_id} (Server-to-Server)
      ▼
[ Grant Order / Deliver Service to Customer ]
```

### Method 2: Direct URL Link (Zero-Backend)

For simple websites, static pages, or direct payment buttons without a server:

```http
https://pay.khubsoja.com/?amount=500&app_name=My+Shop&order_id=ORD-101&customer_name=Rahim&return_url=https://myshop.com/payment-complete
```

---

## 1. Create Checkout Session (`POST /api/payment/create-session`)

Call this endpoint to create an atomic, thread-safe checkout session.

### Request Headers
```http
Content-Type: application/json
```
*(Optional: If `API_KEY_REQUIRED=true` is enabled in gateway `.env`, include `X-API-KEY: your_api_key_here`)*

### Request Body
```json
{
  "app_name": "Flutter Firebase App",
  "app_domain": null,
  "amount": 500.00,
  "order_id": "ORD-2026-001",
  "customer_name": "Rahim Ahmed",
  "customer_phone": "01712345678",
  "customer_email": "customer@example.com",
  "return_url": "myapp://payment-finish",
  "cancel_url": "myapp://cart"
}
```

### Parameters Reference

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `app_name` | String | **Yes** | Your app or website name (e.g. `"KhubSoja App"`). |
| `app_domain` | String | Optional | Web domain (e.g. `"myshop.com"`). Leave `null` for Flutter/Firebase/Mobile apps. |
| `amount` | Number | **Yes** | Amount in BDT. Must be greater than `0` (e.g. `500.00` or `1.00`). |
| `order_id` | String | Optional | Your system's unique order reference (e.g. `"ORD-10025"`). |
| `customer_name` | String | Optional | Customer's full name. |
| `customer_phone` | String | Optional | Customer's 11-digit mobile number. |
| `customer_email` | String | Optional | Customer's email address. |
| `return_url` | String | **Yes** | Web URL (`https://...`) or Mobile Deep Link (`myapp://...`) to redirect the user after payment. |
| `cancel_url` | String | Optional | Fallback URL/Deep Link if customer cancels the payment. |
| `is_mobile` | Boolean | Optional | Pass `true` for mobile apps to guarantee `app_domain` is stored as `NULL`. |

### Response (`200 OK`)
```json
{
  "status": "SUCCESS",
  "session_id": "sess_1792008867457_732599987a853d8c",
  "checkout_url": "https://pay.khubsoja.com/?session_id=sess_1792008867457_732599987a853d8c",
  "transaction_id": "TXN17920088674579d4237f2d3e9",
  "order_id": "1510261",
  "invoice_number": "1510261",
  "client_order_id": "ORD-2026-001",
  "amount": 500.00,
  "currency": "BDT",
  "app_name": "Flutter Firebase App",
  "app_domain": null,
  "customer_name": "Rahim Ahmed"
}
```

---

## 2. Customer Return Callback

When the customer finishes payment, cancels, or presses the back button, the gateway redirects them to your `return_url` with query parameters.

### Example Callback URL (Web App):
```http
GET https://myshop.com/payment/callback?status=SUCCESS&transaction_id=TXN17920088674579d4237f2d3e9&order_id=1510261&client_order_id=ORD-2026-001&amount=500&currency=BDT
```

### Example Callback Deep Link (Mobile App):
```http
myapp://payment-finish?status=SUCCESS&transaction_id=TXN17920088674579d4237f2d3e9&order_id=1510261&client_order_id=ORD-2026-001&amount=500&currency=BDT
```

### Callback Parameters

| Parameter | Values | Description |
| :--- | :--- | :--- |
| `status` | `SUCCESS` \| `PENDING` \| `FAILED` \| `CANCELLED` | Final payment state. See table below. |
| `transaction_id` | String | Gateway unique transaction ID. |
| `order_id` | String | Gateway sequential daily invoice number (e.g. `1510261`). |
| `client_order_id` | String | Your original custom order ID (if supplied in request). |
| `amount` | Number / String | Transaction amount in BDT. |
| `currency` | String | Currency code (`BDT`). |

---

## 3. Server-to-Server Verification

> [!IMPORTANT]
> **Always verify payment status on your backend before delivering services or marking orders as paid.** Never rely solely on front-end redirects.

### Endpoint A: Verify by Transaction ID
```http
GET https://pay.khubsoja.com/api/payment/verify/TXN17920088674579d4237f2d3e9
```

### Endpoint B: Verify by Order ID / Invoice Number
```http
GET https://pay.khubsoja.com/api/payment/order/1510261
```
*(You can pass either the daily sequential invoice number like `1510261` or your custom `client_order_id` like `ORD-2026-001`)*

### Verification Response (`200 OK`)
```json
{
  "status": "SUCCESS",
  "payment_status": "SUCCESS",
  "transaction_id": "TXN17920088674579d4237f2d3e9",
  "order_id": "1510261",
  "invoice_number": "1510261",
  "client_order_id": "ORD-2026-001",
  "amount": 500.00,
  "original_amount": 500.00,
  "currency": "BDT",
  "app_name": "Flutter Firebase App",
  "app_domain": null,
  "provider": "bKash",
  "customer_name": "Rahim Ahmed",
  "customer_phone": "01712345678",
  "customer_email": "customer@example.com",
  "gateway_provider": "paystation",
  "gateway_transaction_id": "PST_98129034",
  "is_manual": false,
  "created_at": "2026-10-15T02:00:00.000Z",
  "updated_at": "2026-10-15T02:01:30.000Z"
}
```

---

## 4. Status Codes Reference

| Status | Meaning | Recommended Action |
| :--- | :--- | :--- |
| `SUCCESS` | Payment was completed and verified. | Mark order as **PAID** and deliver digital/physical products. |
| `PENDING` / `MANUAL_REVIEW` | Customer opted for the 5% discount Bangla QR option and submitted their MFS TrxID. | Mark order as **PENDING VERIFICATION** (manually approved by admin). |
| `FAILED` | Payment failed at the gateway or customer account had insufficient balance. | Prompt customer with retry option. |
| `CANCELLED` | Customer clicked "Cancel & Return" or pressed device/browser back button. | Keep order in cart / allow customer to re-attempt checkout. |

---

## 💻 Code Examples for All Platforms

### 1. Flutter & Firebase (Dart)

Flutter and Firebase mobile apps integrate using `http` and `url_launcher`. Because it is a mobile app without a website domain, `app_domain` is omitted and custom scheme deep linking is used:

```dart
// pubspec.yaml dependencies:
// http: ^1.2.0
// url_launcher: ^6.3.0
// app_links: ^6.0.0 (for receiving deep link callback)

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class KhubSojaPaymentService {
  static const String baseUrl = 'https://pay.khubsoja.com';

  /// Initiates payment from Flutter / Firebase app
  static Future<void> startPayment({
    required double amount,
    required String orderId,
    required String customerName,
    required String customerPhone,
    Function(String error)? onError,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/payment/create-session'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'app_name': 'My Flutter Firebase App', // Your app name (stored in DB)
          // Note: app_domain is omitted because this is a mobile app
          'is_mobile': true,
          'amount': amount,
          'order_id': orderId,
          'customer_name': customerName,
          'customer_phone': customerPhone,
          'return_url': 'myapp://payment-callback', // Deep link registered in your AndroidManifest.xml / Info.plist
          'cancel_url': 'myapp://payment-cancel',
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['status'] == 'SUCCESS') {
        final String checkoutUrl = data['checkout_url'];
        
        // Open checkout in Chrome Custom Tab or External Browser
        final Uri url = Uri.parse(checkoutUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          onError?.call('Could not open payment window');
        }
      } else {
        onError?.call(data['message'] ?? 'Failed to create payment session');
      }
    } catch (e) {
      onError?.call('Network error: $e');
    }
  }

  /// Verifies transaction status
  static Future<Map<String, dynamic>?> verifyPayment(String transactionId) async {
    final response = await http.get(Uri.parse('$baseUrl/api/payment/verify/$transactionId'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }
}
```

#### Android Deep Link Setup (`android/app/src/main/AndroidManifest.xml`)
```xml
<activity android:name=".MainActivity" ...>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" android:host="payment-callback" />
    </intent-filter>
</activity>
```

---

### 2. Android Native (Kotlin — Android 12+ / minSdk 31)

```kotlin
// Dependencies: com.squareup.okhttp3:okhttp:4.12.0, androidx.browser:browser:1.8.0

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

fun launchKhubSojaPayment(
    context: Context,
    amount: Double,
    orderId: String,
    customerName: String,
    customerPhone: String,
    onError: (String) -> Unit
) {
    val client = OkHttpClient()
    val payload = JSONObject().apply {
        put("app_name", "My Android Native App")
        put("is_mobile", true) // No domain; stored as NULL in database
        put("amount", amount)
        put("order_id", orderId)
        put("customer_name", customerName)
        put("customer_phone", customerPhone)
        put("return_url", "myapp://payment-callback")
    }

    val request = Request.Builder()
        .url("https://pay.khubsoja.com/api/payment/create-session")
        .post(payload.toString().toRequestBody("application/json".toMediaType()))
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            onError(e.localizedMessage ?: "Network connection failed")
        }

        override fun onResponse(call: Call, response: Response) {
            val body = response.body?.string() ?: "{}"
            val json = JSONObject(body)

            if (response.isSuccessful && json.optString("status") == "SUCCESS") {
                val checkoutUrl = json.getString("checkout_url")

                // Open sleek Chrome Custom Tab
                val customTabsIntent = CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build()
                customTabsIntent.launchUrl(context, Uri.parse(checkoutUrl))
            } else {
                onError(json.optString("message", "Payment session failed"))
            }
        }
    })
}
```

---

### 3. PHP / Laravel

For websites where an actual web domain exists, `app_domain` is supplied:

```php
<?php

class KhubSojaPayment {
    private const BASE_URL = 'https://pay.khubsoja.com';

    /**
     * Create checkout session and redirect customer
     */
    public static function createCheckoutSession(float $amount, string $orderId, string $customerName, string $returnUrl) {
        $payload = [
            'app_name'      => 'My Web Store',
            'app_domain'    => 'mywebstore.com', // Web domain recorded in database
            'amount'        => $amount,
            'order_id'      => $orderId,
            'customer_name' => $customerName,
            'return_url'    => $returnUrl,
        ];

        $ch = curl_init(self::BASE_URL . '/api/payment/create-session');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);

        if (!empty($result['checkout_url'])) {
            header('Location: ' . $result['checkout_url']);
            exit;
        }

        throw new Exception($result['message'] ?? 'Failed to initialize payment gateway');
    }

    /**
     * Server-to-server transaction verification
     */
    public static function verifyTransaction(string $transactionId): ?array {
        $url = self::BASE_URL . '/api/payment/verify/' . urlencode($transactionId);
        $json = @file_get_contents($url);
        if (!$json) return null;
        
        return json_decode($json, true);
    }
}
```

---

### 4. JavaScript / Node.js (Express / Next.js)

```javascript
import fetch from 'node-fetch';

const BASE_URL = 'https://pay.khubsoja.com';

// 1. Create checkout session
export async function createCheckout({ amount, orderId, customerName, returnUrl }) {
  const response = await fetch(`${BASE_URL}/api/payment/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_name: 'Node Web Store',
      app_domain: 'nodestore.com',
      amount,
      order_id: orderId,
      customer_name: customerName,
      return_url: returnUrl,
    }),
  });

  const data = await response.json();
  if (data.status === 'SUCCESS') {
    return data.checkout_url;
  }
  throw new Error(data.message || 'Payment initiation failed');
}

// 2. Server verification endpoint
export async function verifyPayment(transactionId) {
  const response = await fetch(`${BASE_URL}/api/payment/verify/${encodeURIComponent(transactionId)}`);
  return await response.json();
}
```

---

### 5. Python (Django / Flask / FastAPI)

```python
import requests

BASE_URL = 'https://pay.khubsoja.com'

def create_payment_session(amount: float, order_id: str, return_url: str) -> str:
    payload = {
        'app_name': 'Python Store',
        'app_domain': 'pythonstore.com',
        'amount': amount,
        'order_id': order_id,
        'return_url': return_url
    }
    res = requests.post(f'{BASE_URL}/api/payment/create-session', json=payload, timeout=10)
    data = res.json()
    if data.get('status') == 'SUCCESS':
        return data['checkout_url']
    raise Exception(data.get('message', 'Failed to create payment session'))

def verify_payment(transaction_id: str) -> dict:
    res = requests.get(f'{BASE_URL}/api/payment/verify/{transaction_id}', timeout=10)
    return res.json()
```

---

### 6. cURL & Postman

#### Create Session (Web App with Domain):
```bash
curl -X POST https://pay.khubsoja.com/api/payment/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "My Web Store",
    "app_domain": "mywebstore.com",
    "amount": 500.00,
    "order_id": "ORD-001",
    "customer_name": "Karim Hasan",
    "return_url": "https://mywebstore.com/callback"
  }'
```

#### Create Session (Mobile App — Flutter / Firebase without Domain):
```bash
curl -X POST https://pay.khubsoja.com/api/payment/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "Flutter Firebase App",
    "is_mobile": true,
    "amount": 500.00,
    "order_id": "ORD-002",
    "customer_name": "Karim Hasan",
    "return_url": "myapp://payment-finish"
  }'
```

#### Verify Transaction:
```bash
curl https://pay.khubsoja.com/api/payment/verify/TXN17920088674579d4237f2d3e9
```

#### Verify by Order ID / Invoice Number:
```bash
curl https://pay.khubsoja.com/api/payment/order/1510261
```

---

## 🔒 Security Best Practices

1. **Amount Tampering Protection:** The gateway rejects any discrepancy between the initiated session amount and the submitted amount. Always check `amount` in the verification response to ensure it matches your database.
2. **Database Immutability:** Once a payment achieves `SUCCESS`, it can never be downgraded to `FAILED` or `CANCELLED`, even if a webhook is delayed or an exit button is pressed.
3. **Back-Button Interceptor:** If a user clicks back during checkout, the gateway cleanly registers the cancellation and returns `status=CANCELLED` so your app can resume gracefully without leaving dangling orders.


# ১টাকা টেস্ট পেমেন্ট করার জন্য লিংক
https://pay.khubsoja.com/?amount=1&app_name=Khub+Soja+Test&customer_name=Shishir+Ahmed