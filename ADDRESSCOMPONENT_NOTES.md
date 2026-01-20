# Checkout.com AddressComponent Integration Notes

## Summary
Based on the official Checkout.com documentation, **YES** - the AddressComponent can display both input fields for new customers AND automatically populate saved shipping addresses for returning Remember Me customers.

## Key Findings

### 1. AddressComponent Functionality
The Flow `AddressComponent` (also called `shipping_address`) provides:
- **For new customers**: Input fields to collect shipping address
- **For returning customers**: Auto-populates their saved shipping address when they authenticate via Remember Me

### 2. Requirements
To use the AddressComponent with Remember Me, you **MUST**:
1. Have Remember Me enabled on your account (contact Checkout.com support)
2. Integrate the **AuthenticationComponent** first (required dependency)
3. The customer must provide their email through the authentication component

### 3. How It Works

#### New Customer Flow:
1. Customer enters email in authentication component
2. AddressComponent displays empty input fields
3. Customer fills in their shipping address
4. Address is saved with their Remember Me profile after successful payment

#### Returning Customer Flow:
1. Customer enters email in authentication component
2. System detects they have a Remember Me account
3. Customer authenticates via OTP (one-time password)
4. Upon successful authentication, their **saved shipping address is automatically populated** in the AddressComponent
5. Customer can modify the address if needed

### 4. Implementation Code

```javascript
// 1. Create authentication component (required)
const authenticationComponent = checkout.create('authentication', {
  onChange: (_self, data) => {
    console.log('Customer email:', data.email);
  }
});
authenticationComponent.mount('#authentication-container');

// 2. Create address component (will auto-populate for returning customers)
const addressComponent = checkout.create('shipping_address', {
  onChange: (_self, data) => {
    console.log('Shipping address:', data.shippingAddress);
  }
});
addressComponent.mount('#address-container');
```

### 5. Data Structure
The `data.shippingAddress` object from `onChange` event contains:
- `address_line1`
- `address_line2` (optional)
- `city`
- `state` (optional)
- `zip`
- `country`

### 6. Benefits for Our Integration
Using AddressComponent would:
✅ Eliminate our manual shipping address form
✅ Provide seamless auto-fill for returning customers
✅ Standardize address format with Checkout.com's validation
✅ Reduce friction in checkout flow
✅ Store addresses automatically with Remember Me

### 7. Current Integration vs. Recommended
**Current**: 
- Manual HTML form for shipping address
- No integration with Remember Me
- Manual validation required

**With AddressComponent**:
- Checkout.com-managed component
- Auto-populates for returning customers
- Built-in validation
- Automatically saved to customer profile

## Recommendation
We should integrate both `AuthenticationComponent` and `AddressComponent` to replace our current manual shipping address form. This would provide a better user experience, especially for returning customers, and reduce the amount of form code we need to maintain.

## Documentation References
- [Enable Remember Me - Address Component](https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-your-website/extend-your-flow-integration/enable-remember-me#Integrate_the_address_component_(optional))
- [AddressComponent API Reference](https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-your-website/flow-library-reference/addresscomponent)

---
**Note**: AddressComponent is marked as "Beta" in the documentation as of July 9, 2025. Always test thoroughly in sandbox before production deployment.
