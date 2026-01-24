# Order Workflow Documentation

## How Multiple Orders from the Same Customer are Handled

### Overview
When a customer places multiple orders from the same device/table, each order is treated as a **separate, independent order**. However, they are grouped together for billing purposes.

### Order Flow

1. **Customer Places First Order:**
   - Customer scans QR code → Profile modal appears (non-removable)
   - Customer enters name, selects gender, optionally uploads avatar
   - Profile is saved to localStorage and sent with order
   - Order is created with status `SERVER_REVIEW`
   - Order includes: `deviceId`, `customerName`, `customerGender`, `customerAvatar`

2. **Customer Places Second/Additional Orders:**
   - Customer can order more items (cart is cleared after each order)
   - New order is created with the **same `deviceId`** but **different order ID**
   - Customer profile is automatically included from localStorage
   - Each order goes through the same workflow independently

### How Orders are Grouped

#### In Server View (Bills):
- Orders are **grouped by `deviceId`** for billing purposes
- All orders from the same device appear together
- Server can see customer name for each device group
- Server can process payments for selected orders or all orders

#### In Kitchen View:
- Each order appears **individually** as a separate card
- Orders show customer name if available
- Kitchen sees orders with status `PREPARING` or `READY`
- Each order is prepared independently

#### In Orders View (Admin):
- All orders are listed individually
- Orders show customer name, gender icon, and avatar
- Orders can be filtered by status
- Each order can be reviewed/managed separately

### Order Status Flow

1. **SERVER_REVIEW** (Initial state)
   - Order appears in Orders view
   - Server clicks "Revizuiește" button
   - Server can add notes, review items
   - Server sends to kitchen → Status changes to `PREPARING`

2. **PREPARING** (Kitchen)
   - Order appears in Kitchen view
   - Kitchen prepares the order
   - Kitchen marks as ready → Status changes to `READY`

3. **READY**
   - Order is ready for serving
   - Appears in both Kitchen and Orders view
   - Server marks as served → Status changes to `SERVED`

4. **SERVED**
   - Order is complete
   - No longer appears in active views

### Key Points

- **Each order is independent**: Multiple orders from same device are separate orders
- **Same customer profile**: All orders from same device use the same customer profile
- **Grouped for billing**: Orders are grouped by `deviceId` for payment processing
- **Separate in kitchen**: Each order is prepared separately in kitchen
- **Real-time updates**: All views update in real-time via Socket.IO

### Example Scenario

**Table 5, 3 customers:**
- Customer A (device_123) orders Pizza → Order #1 (SERVER_REVIEW)
- Customer B (device_456) orders Pasta → Order #2 (SERVER_REVIEW)  
- Customer A (device_123) orders Salad → Order #3 (SERVER_REVIEW)

**Server View:**
- Device device_123: Orders #1 and #3 (Customer A)
- Device device_456: Order #2 (Customer B)

**Kitchen View:**
- Order #1 (Pizza) - Customer A
- Order #2 (Pasta) - Customer B
- Order #3 (Salad) - Customer A

**Billing:**
- All 3 orders are part of Table 5's bill
- Can be paid together or separately
- Each order tracks its own payment status

## Payment and Tipping Workflow

### Customer Payment Request
1. **Customer selects orders** to pay (or all orders if multiple)
2. **Customer selects payment type**:
   - Numerar (CASH) - default
   - Card (POS)
3. **Customer selects tip**:
   - Preset options: 0%, 10%, 20%, 30% (default: 20%)
   - Custom tip: Opens drawer to enter custom amount (increments of 5 RON)
   - Custom amount is converted to percentage and preserved
4. **Customer clicks "Process Payment"**:
   - Bill request is sent to server
   - Payment type and tip percentage are included in request
   - Customer sees confirmation notification

### Server Payment Processing
1. **Server receives notification** of payment request
2. **Server opens payment dialog**:
   - Selected orders total is displayed
   - Payment type is pre-selected from client request
   - Tip dropdown includes:
     - Standard options: 0%, 5%, 10%, 15%, 20%, 25%, Custom
     - **Custom client percentage** (e.g., "71% (Client)") if client selected custom tip
   - Tip is pre-selected if client specified one
3. **Server can modify** payment type or tip if needed
4. **Server processes payment**:
   - Payment is recorded in database
   - Orders are marked as paid
   - Table status is updated
   - Customer receives confirmation

### Tip Management
- **Tip Types**: PERCENTAGE (default) or AMOUNT
- **Tip Preservation**: Custom tip percentages are preserved across bill refreshes
- **Server Integration**: Custom client tip percentages automatically appear in server's dropdown
- **Default Values**: Payment type defaults to CASH, tip defaults to 20%

## Table Reset and Order Filtering

### Overview
When a table is reset by the server, the system ensures that old orders from previous customers are hidden from both the server view and customer view. This is achieved through timestamp-based filtering using the `lastResetAt` field on the `Table` model.

### Table Reset Process

1. **Server Resets Table:**
   - Server clicks "Resetează Masă" button in Server View
   - Table status is set to `AVAILABLE`
   - `lastResetAt` timestamp is updated to current time
   - QR code token remains **valid and reusable** (not deactivated)
   - Socket event `table_session_revoked` is emitted to current customers

2. **Customer Session Clearing:**
   - Customers receive `table_session_revoked` socket event
   - Customer session is cleared (cart, table info, token)
   - Customer favorites for the restaurant are cleared
   - Customer profile is cleared from localStorage
   - All orders are cleared from client-side store
   - Customer is redirected to "Thank You" page

3. **Order Filtering:**
   - Server-side endpoints filter orders by `createdAt >= lastResetAt`
   - Only orders created after the last reset are returned
   - This ensures old paid orders from previous customers don't appear
   - Both server bill view and customer order history respect this filter

### Key Features

- **QR Code Reusability**: QR codes remain valid after table reset - no need to regenerate or reprint
- **Automatic Order Filtering**: Old orders are automatically hidden based on reset timestamp
- **Real-time Session Revocation**: Customers are immediately notified when table is reset
- **Complete Session Cleanup**: All customer data (orders, favorites, profile) is cleared on reset

### Server Assignment and Order Routing

#### Table Assignment
- Tables can be assigned to specific servers via `serverId` field
- When a table is assigned, orders are routed to that specific server
- Free tables (no `serverId`) notify all servers in the restaurant

#### Order Notifications
- When an order is created, the system checks if the table has an assigned server
- If assigned: Order notification includes `tableServerId` for targeted routing
- If free: Order notification has `tableServerId: null` - all servers see it
- Frontend can filter notifications based on current user's ID

### Bill Request Management

#### Fetching Bill Requests
- New endpoint: `GET /api/bills/requests` - Returns all unprocessed bill requests for the restaurant
- Bill requests are filtered by `processed: false`
- Includes table information (id, name, status) for context

#### Payment Processing Notifications
- When payment is processed, socket event `payment_processed` is emitted
- Event includes: `tableId`, `orderIds`, `payments`
- Clients receive real-time updates when payments are completed
- Customer app refreshes orders list when payment is processed
