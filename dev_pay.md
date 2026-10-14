# 💳 Payment Gateway API Integration Guide

This document describes how to integrate the **Khub Soja Payment Gateway (`https://pay.khubsoja.com`)** into external apps and websites.

---

## 🌐 Base URL & Endpoints

**Base URL:** `https://pay.khubsoja.com`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payment/create-session` | Create a checkout session and obtain `checkout_url`. |
| `GET` | `/api/payment/verify/{transaction_id}` | Verify payment status by `transaction_id`. |
| `GET` | `/api/payment/order/{order_id}` | Look up payment status by `order_id` (your order ID or sequential invoice number). |

---

## 🚀 Integration Methods

### Option 1: Direct Link (Zero-Backend)
Open or redirect the user directly to:
```
https://pay.khubsoja.com/?amount=500&app_name=Your+App&order_id=ORD-101&return_url=https://your-site.com/callback
```

### Option 2: API Session (Recommended for Production Apps)
1. Your server/app calls `POST /api/payment/create-session`.
2. Open the returned `checkout_url` in a browser, Android Chrome Custom Tab, or WebView.
3. The customer pays.
4. The gateway redirects back to your `return_url`.
5. Your backend verifies via `GET /api/payment/verify/{transaction_id}`.

---

## 1. Create Session (`POST /api/payment/create-session`)

### Request:
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "app_name": "My App / Store",
  "amount": 500.00,
  "order_id": "ORD-2026-001",
  "customer_name": "Customer Name",
  "customer_phone": "01712345678",
  "customer_email": "customer@example.com",
  "return_url": "https://your-site.com/payment/callback",
  "cancel_url": "https://your-site.com/cart"
}
```

### Parameters:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `app_name` | String | **Yes** | Your app or website name (shown on invoice). |
| `amount` | Number | **Yes** | Amount in BDT (e.g. `500.00` or `1.00`). Must be > `0`. |
| `order_id` | String | Optional | Your system's unique order reference. |
| `customer_name` | String | Optional | Customer's full name. |
| `customer_phone` | String | Optional | Customer's mobile number. |
| `customer_email` | String | Optional | Customer's email. |
| `return_url` | String | **Yes** | Callback URL to return the customer to after payment. |
| `cancel_url` | String | Optional | Redirect URL if the customer cancels. |

### Response (`200 OK`):
```json
{
  "status": "SUCCESS",
  "session_id": "sess_1791275100000_39a0ae9cc7f84054",
  "checkout_url": "https://pay.khubsoja.com/?session_id=sess_1791275100000_39a0ae9cc7f84054",
  "transaction_id": "TXN17912751000009d4237f2d3e9",
  "order_id": "0610261",
  "client_order_id": "ORD-2026-001",
  "amount": 500.00,
  "currency": "BDT"
}
```

---

## 2. Customer Return Callback

After payment, the gateway redirects the user to your `return_url` with query parameters:

```http
GET https://your-site.com/payment/callback?status=SUCCESS&transaction_id=TXN17912751000009d4237f2d3e9&order_id=0610261&client_order_id=ORD-2026-001
```

### Parameters Received at `return_url`:
| Parameter | Values | Description |
| :--- | :--- | :--- |
| `status` | `SUCCESS` \| `PENDING` | `SUCCESS` = Instant online payment confirmed. <br>`PENDING` = 5% discount manual MFS payment submitted (under manual verification). |
| `transaction_id` | String | Gateway transaction ID. |
| `order_id` | String | Sequential daily invoice number. |
| `client_order_id` | String | Your original `order_id` (if provided). |

---

## 3. Server-to-Server Verification (`GET /api/payment/verify/{transaction_id}`)

Always verify transactions server-to-server before granting services:

### Request:
```http
GET https://pay.khubsoja.com/api/payment/verify/TXN17912751000009d4237f2d3e9
```

### Response (`200 OK`):
```json
{
  "status": "SUCCESS",
  "data": {
    "transaction_id": "TXN17912751000009d4237f2d3e9",
    "order_id": "0610261",
    "client_order_id": "ORD-2026-001",
    "amount": "500.00",
    "currency": "BDT",
    "status": "SUCCESS",
    "provider": "paystation",
    "customer_name": "Customer Name",
    "customer_phone": "01712345678",
    "app_name": "My App / Store",
    "gateway_transaction_id": "PST_TRX_981990128",
    "created_at": "2026-10-06T07:15:00.000Z"
  }
}
```

*(You can also query by order ID: `GET https://pay.khubsoja.com/api/payment/order/{order_id}`)*

---

## 4. Status Codes Reference

| Status | Meaning | Action in Your System |
| :--- | :--- | :--- |
| `SUCCESS` | Payment completed successfully via online gateway. | Immediately deliver product/service and mark order as **PAID**. |
| `PENDING` / `MANUAL_REVIEW` | Customer used the 5% discount option and submitted their MFS TrxID. | Mark order as **PENDING VERIFICATION** (reviewed within 2–24h). |
| `FAILED` | Payment failed. | Prompt user to retry. |
| `CANCELLED` | User cancelled the checkout. | Return user to cart/checkout screen. |

---

## 💻 Code Examples

### Android (Kotlin — Android 12+ / minSdk 31)
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
    returnUrl: String,
    onError: (String) -> Unit
) {
    val client = OkHttpClient()
    val payload = JSONObject().apply {
        put("app_name", "My Android App")
        put("amount", amount)
        put("order_id", orderId)
        put("customer_name", customerName)
        put("return_url", returnUrl)
    }

    val request = Request.Builder()
        .url("https://pay.khubsoja.com/api/payment/create-session")
        .post(payload.toString().toRequestBody("application/json".toMediaType()))
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            onError(e.localizedMessage ?: "Network error")
        }

        override fun onResponse(call: Call, response: Response) {
            val json = JSONObject(response.body?.string() ?: "{}")
            if (response.isSuccessful && json.optString("status") == "SUCCESS") {
                val checkoutUrl = json.getString("checkout_url")
                // Open in Chrome Custom Tab
                CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(checkoutUrl))
            } else {
                onError(json.optString("message", "Payment initiation failed"))
            }
        }
    })
}
```

---

### Flutter (Dart)
```dart
// Dependencies: http, url_launcher
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

Future<void> startKhubSojaPayment({
  required double amount,
  required String orderId,
  required String customerName,
  required String returnUrl,
}) async {
  final res = await http.post(
    Uri.parse('https://pay.khubsoja.com/api/payment/create-session'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'app_name': 'My Flutter App',
      'amount': amount,
      'order_id': orderId,
      'customer_name': customerName,
      'return_url': returnUrl,
    }),
  );

  final data = jsonDecode(res.body);
  if (res.statusCode == 200 && data['status'] == 'SUCCESS') {
    await launchUrl(Uri.parse(data['checkout_url']), mode: LaunchMode.externalApplication);
  } else {
    throw Exception(data['message'] ?? 'Payment creation failed');
  }
}
```

---

### PHP / Laravel
```php
<?php
// 1. Create Checkout Session
function createPaymentSession($amount, $orderId, $customerName, $returnUrl) {
    $payload = json_encode([
        'app_name'      => 'My PHP Store',
        'amount'        => (float) $amount,
        'order_id'      => $orderId,
        'customer_name' => $customerName,
        'return_url'    => $returnUrl,
    ]);

    $ch = curl_init('https://pay.khubsoja.com/api/payment/create-session');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    if (!empty($result['checkout_url'])) {
        header('Location: ' . $result['checkout_url']);
        exit;
    }
    throw new Exception($result['message'] ?? 'Failed to initialize payment');
}

// 2. Verify on Callback
function verifyPayment($transactionId) {
    $json = file_get_contents('https://pay.khubsoja.com/api/payment/verify/' . urlencode($transactionId));
    $data = json_decode($json, true);
    return $data['data'] ?? null;
}
```

---

### JavaScript / Node.js
```javascript
// 1. Initiate Checkout
async function createCheckout(amount, orderId, returnUrl) {
  const res = await fetch('https://pay.khubsoja.com/api/payment/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_name: 'My Web Store',
      amount,
      order_id: orderId,
      return_url: returnUrl,
    }),
  });
  const data = await res.json();
  if (data.status === 'SUCCESS') {
    window.location.href = data.checkout_url;
  }
}

// 2. Server-side Verification
async function verifyTransaction(transactionId) {
  const res = await fetch(`https://pay.khubsoja.com/api/payment/verify/${transactionId}`);
  const result = await res.json();
  return result.data; // { status: 'SUCCESS' | 'PENDING', amount: '500.00', ... }
}
```

---

### Python
```python
import requests

def create_checkout(amount: float, order_id: str, return_url: str):
    res = requests.post(
        'https://pay.khubsoja.com/api/payment/create-session',
        json={
            'app_name': 'My Python App',
            'amount': amount,
            'order_id': order_id,
            'return_url': return_url,
        }
    )
    data = res.json()
    if data.get('status') == 'SUCCESS':
        return data['checkout_url']
    raise Exception(data.get('message', 'Failed to create session'))

def verify_payment(transaction_id: str):
    res = requests.get(f'https://pay.khubsoja.com/api/payment/verify/{transaction_id}')
    return res.json().get('data')
```

---

### cURL
```bash
# Create Session
curl -X POST https://pay.khubsoja.com/api/payment/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "Test App",
    "amount": 1.00,
    "order_id": "TEST-01",
    "return_url": "https://example.com/callback"
  }'

# Verify Transaction
curl https://pay.khubsoja.com/api/payment/verify/TXN17912751000009d4237f2d3e9
```
১টাকা টেস্ট পেমেন্ট
https://pay.khubsoja.com/?amount=1&app_name=Khub+Soja+Test&customer_name=Shishir+Ahmed
