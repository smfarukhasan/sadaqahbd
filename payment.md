# ম্যানুয়াল পেমেন্ট ও ডাটাবেজ আপডেট SQL কোড (Direct Copy-Paste)

> এই কোডগুলো রান করলে অ্যাপের মেয়াদ/এসএমএস বৃদ্ধি হওয়ার পাশাপাশি ট্রানজেকশন হিস্টোরিও স্বয়ংক্রিয়ভাবে ডাটাবেজে রেকর্ড হয়ে যাবে।

---

## ১. Apps Privilege (অ্যাপ সাবস্ক্রিপশন)

### ১. বাৎসরিক পেমেন্ট (৳৫,০০০ ও +১ বছর মেয়াদ বৃদ্ধি)
```sql
START TRANSACTION;

SET @PREV_VALID_UNTIL = (SELECT current_valid_until FROM app_maintenance_settings WHERE id = 'singleton');
SET @NEW_VALID_UNTIL  = DATE_ADD(@PREV_VALID_UNTIL, INTERVAL 1 YEAR);

UPDATE app_maintenance_settings 
SET current_valid_until = @NEW_VALID_UNTIL,
    updated_at = NOW()
WHERE id = 'singleton';

INSERT INTO app_maintenance_payments (
  id, plan_type, amount, transaction_id, order_id, gateway_provider, status,
  paid_by_name, paid_by_email, previous_valid_until, extended_valid_until, paid_at, created_at
) VALUES (
  UUID(), 'yearly', 5000.00,
  CONCAT('MANUAL-YR-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-MANUAL-', UNIX_TIMESTAMP()),
  'manual_cash', 'success', 'Master Admin', 'admin@sadaqahbd.com',
  @PREV_VALID_UNTIL, @NEW_VALID_UNTIL, NOW(), NOW()
);

COMMIT;
```

---

### ২. মাসিক পেমেন্ট (৳৫০০ ও +১ মাস মেয়াদ বৃদ্ধি)
```sql
START TRANSACTION;

SET @PREV_VALID_UNTIL = (SELECT current_valid_until FROM app_maintenance_settings WHERE id = 'singleton');
SET @NEW_VALID_UNTIL  = DATE_ADD(@PREV_VALID_UNTIL, INTERVAL 1 MONTH);

UPDATE app_maintenance_settings 
SET current_valid_until = @NEW_VALID_UNTIL,
    updated_at = NOW()
WHERE id = 'singleton';

INSERT INTO app_maintenance_payments (
  id, plan_type, amount, transaction_id, order_id, gateway_provider, status,
  paid_by_name, paid_by_email, previous_valid_until, extended_valid_until, paid_at, created_at
) VALUES (
  UUID(), 'monthly', 500.00,
  CONCAT('MANUAL-MO-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-MANUAL-', UNIX_TIMESTAMP()),
  'manual_cash', 'success', 'Master Admin', 'admin@sadaqahbd.com',
  @PREV_VALID_UNTIL, @NEW_VALID_UNTIL, NOW(), NOW()
);

COMMIT;
```

---

## ২. SMS Packages (এসএমএস প্যাকেজ প্রতিটির জন্য আলাদা কোড)

### ১. ২০ এসএমএস প্যাকেজ (৳১২)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '20 SMS Package', 20, 12.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 20,
    remaining_sms  = remaining_sms + 20,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ২. ৫০ এসএমএস প্যাকেজ (৳২৯)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '50 SMS Package', 50, 29.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 50,
    remaining_sms  = remaining_sms + 50,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ৩. ১০০ এসএমএস প্যাকেজ (৳৫৫)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '100 SMS Package', 100, 55.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 100,
    remaining_sms  = remaining_sms + 100,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ৪. ১৫০ এসএমএস প্যাকেজ (৳৮৩)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '150 SMS Package', 150, 83.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 150,
    remaining_sms  = remaining_sms + 150,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ৫. ২০০ এসএমএস প্যাকেজ (৳১০০)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '200 SMS Package', 200, 100.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 200,
    remaining_sms  = remaining_sms + 200,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ৬. ৫০০ এসএমএস প্যাকেজ (৳২৫০)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '500 SMS Package', 500, 250.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 500,
    remaining_sms  = remaining_sms + 500,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ৭. ১,০০০ এসএমএস প্যাকেজ (৳৫০০)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '1000 SMS Package', 1000, 500.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 1000,
    remaining_sms  = remaining_sms + 1000,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```

---

### ৮. ২,৫০০ এসএমএস প্যাকেজ (৳১,২৫০)
```sql
START TRANSACTION;

INSERT INTO sms_package_purchases (
  id, package_name, sms_count, amount, transaction_id, order_id, status, purchased_at, created_at
) VALUES (
  UUID(), '2500 SMS Package', 2500, 1250.00,
  CONCAT('SMS-MANUAL-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
  CONCAT('ORD-SMS-', UNIX_TIMESTAMP()),
  'success', NOW(), NOW()
);

UPDATE sms_balance 
SET total_credited = total_credited + 2500,
    remaining_sms  = remaining_sms + 2500,
    updated_at     = NOW()
WHERE id = 'singleton';

COMMIT;
```
