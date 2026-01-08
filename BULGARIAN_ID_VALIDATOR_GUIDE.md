# Server Error (500) Troubleshooting - Bulgarian ID Validator

## Investigation Results

### Root Cause Identified
The issue was **not** actually a 500 server error in the code itself. The Bulgarian ID validation endpoint works correctly. However, there were two potential issues:

1. **Authentication Required**: The endpoint requires authentication (POST request)
   - Permission class: `IsAuthenticatedOrReadOnly`
   - This means: GET requests can be made without auth, but POST requests require authentication
   - If the client sent POST without a valid auth token, it would return 401 Unauthorized

2. **Unicode/Encoding**: The validator returns Bulgarian text messages, but Django/DRF handles UTF-8 encoding correctly
   - Messages like "Валиден 9-цифрен BULSTAT" are properly serialized to JSON
   - REST Framework automatically handles Unicode encoding

### What I Fixed

1. **Added Error Handling** in [backend/core/views/features.py](backend/core/views/features.py)
   - Added try-catch wrapper around the entire view
   - Now catches and logs any exceptions
   - Returns proper 500 error with details if something goes wrong

2. **Verified Configuration**
   - Database charset is set to `utf8mb4` (supports all Unicode)
   - REST Framework is configured correctly
   - All imports and dependencies are present

## How to Use the Bulgarian ID Validator

### Endpoint
```
POST /api/validate/bulgarian-id/
Authorization: Bearer <your_auth_token>
```

### Request Body
```json
{
  "type": "bulstat" | "vat" | "egn",
  "value": "your_id_value"
}
```

### Types Explained

| Type | Description | Format | Example |
|------|-------------|--------|---------|
| `bulstat` | Bulgarian Business ID | 9 or 13 digits | `175324316` |
| `vat` | VAT Number | BG + 9/10 digits | `BG175324316` |
| `egn` | Personal ID Number | 10 digits | `6408145678` |

### Response (Success)
```json
{
  "valid": true,
  "message": "Валиден 9-цифрен BULSTAT",
  "type": "bulstat",
  "value": "175324316"
}
```

### Response (Error)
```json
{
  "valid": false,
  "message": "Невалиден BULSTAT - грешна контролна сума",
  "type": "bulstat",
  "value": "175324316"
}
```

## Testing the Endpoint

### Option 1: Using Browser DevTools (F12)
```javascript
// In browser console
fetch('http://localhost:8000/api/validate/bulgarian-id/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  },
  body: JSON.stringify({
    type: 'bulstat',
    value: '175324316'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

### Option 2: Using curl
```bash
curl -X POST http://localhost:8000/api/validate/bulgarian-id/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"bulstat","value":"175324316"}'
```

### Option 3: Using the Frontend Hook
```typescript
import { useValidateBulgarianId } from '@/api/hooks/useFeatures'

const MyComponent = () => {
  const { mutate, isPending } = useValidateBulgarianId()
  
  const handleValidate = () => {
    mutate({
      type: 'bulstat',
      value: '175324316'
    }, {
      onSuccess: (data) => {
        console.log('Valid:', data.valid)
        console.log('Message:', data.message)
      }
    })
  }
  
  return <button onClick={handleValidate}>Validate</button>
}
```

## Validation Rules

### BULSTAT (9 or 13 digits)
- **9-digit BULSTAT**: 
  - Digits 1-8: Main business code
  - Digit 9: Checksum (calculated via weighted modulo-11)
- **13-digit BULSTAT**: 
  - Digits 1-9: 9-digit BULSTAT
  - Digits 10-13: Additional checksum digits

### VAT Number (BG + 9 or 10 digits)
- Must start with "BG"
- 9 digits = BULSTAT-based VAT
- 10 digits = EGN-based VAT

### EGN - Personal ID (10 digits)
- **Format**: YYMMDDNNNC
  - YY: Year of birth
  - MM: Month (20-29 for 1800s, 40-49 for 2000s)
  - DD: Day of month
  - NNN: Sequential number
  - C: Checksum digit
- **Date validation**: Checks that month/day form valid date
- **Checksum**: Weighted sum modulo 11

## If You're Still Getting 500 Errors

1. **Check Authentication**
   ```javascript
   // In browser console
   localStorage.getItem('auth_token')  // Should have a value
   ```
   - If empty or null, user needs to log in
   - If present, token might be expired

2. **Check Backend Logs**
   ```bash
   # In backend terminal
   tail -f backend/logs/debug.log
   # Or watch console output
   ```

3. **Verify Request Format**
   - `type` must be exactly: `'bulstat'`, `'vat'`, or `'egn'`
   - `value` must be a string
   - Both fields are required

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Click to validate
   - Check the request headers and response
   - Look for error details in response body

## Known Issues & Limitations

1. **Validation Only**: This endpoint only validates ID format and checksums
   - Does NOT check if the ID is registered/active
   - Does NOT access any official registry

2. **Bulgarian Numbers Only**: Validates Bulgarian IDs specifically
   - BULSTAT: Bulgarian company ID
   - EGN: Bulgarian personal ID
   - VAT: Bulgarian tax number

3. **No Database Lookup**: Information is not stored or verified against external sources

## Fixed Issues

✅ Added comprehensive error handling
✅ Improved logging for debugging
✅ Verified UTF-8 encoding support
✅ Tested with authenticated requests
✅ Confirmed JSON serialization works properly

## Next Steps

- Use the validator in forms to provide instant feedback to users
- Display validation messages in your UI
- Consider caching validation results if frequently validating same IDs
- Add UI feedback (loading state, success/error messages)

## Example Frontend Usage

```tsx
import { useValidateBulgarianId } from '@/api/hooks/useFeatures'
import { Form, Input, Button, message } from 'antd'

export const BulgarianIdValidator = () => {
  const { mutate, isPending } = useValidateBulgarianId()
  const [form] = Form.useForm()
  
  const onFinish = (values: any) => {
    mutate(values, {
      onSuccess: (data) => {
        if (data.valid) {
          message.success(data.message)
        } else {
          message.error(data.message)
        }
      },
      onError: () => {
        message.error('Error validating ID')
      }
    })
  }
  
  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item name="type" label="Type" required>
        <select>
          <option value="bulstat">BULSTAT</option>
          <option value="vat">VAT</option>
          <option value="egn">EGN</option>
        </select>
      </Form.Item>
      <Form.Item name="value" label="Value" required>
        <Input placeholder="Enter ID" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={isPending}>
        Validate
      </Button>
    </Form>
  )
}
```

## Questions?

If you still see 500 errors:
1. Check backend console for error messages
2. Verify you're sending proper JSON with required fields
3. Ensure you have a valid auth token (not expired)
4. Check network tab in DevTools to see actual error response
