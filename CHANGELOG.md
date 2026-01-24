# Changelog

## [Recent Updates] - 2025-01-22

### 🆕 New Features

#### Table Reset with Order Filtering
- **Table Reset Functionality**: Servers can reset tables to `AVAILABLE` status, preparing them for new customers
- **Timestamp-Based Order Filtering**: Tables now have `lastResetAt` field that tracks when the table was last reset
- **Automatic Order Hiding**: Orders created before `lastResetAt` are automatically filtered out from:
  - Server bill view (`/api/bills/tables/:tableId/bill`)
  - Customer order history (`/api/public/orders`)
  - Table bills list (`/api/bills/tables`)
- **QR Code Reusability**: QR codes remain valid and reusable after table reset - no need to regenerate or reprint
- **Real-time Session Revocation**: When table is reset, customers receive `table_session_revoked` socket event and are redirected to "Thank You" page

#### Server Assignment System
- **Table-to-Server Assignment**: Tables can be assigned to specific servers via `serverId` field
- **Targeted Order Notifications**: Orders from assigned tables are routed to the assigned server
- **Free Table Handling**: Unassigned tables notify all servers in the restaurant
- **Order Routing**: New orders include `tableServerId` in socket events for frontend filtering

#### Enhanced Session Management
- **Complete Session Clearing**: When table is reset, customer session is fully cleared:
  - Cart items
  - Table information and token
  - Restaurant favorites (localStorage)
  - Customer profile (localStorage)
  - All orders from store
- **Real-time Updates**: Socket events ensure immediate synchronization across all clients

#### Bill Request Management
- **Bill Request Endpoint**: New `GET /api/bills/requests` endpoint to fetch all unprocessed bill requests
- **Restaurant-Scoped**: Returns only bill requests for tables in the current restaurant
- **Table Context**: Includes table information (id, name, status) with each request

#### Payment Processing Notifications
- **Real-time Payment Updates**: Socket event `payment_processed` emitted when payment is completed
- **Client Synchronization**: Customer app automatically refreshes orders when payment is processed
- **Event Data**: Includes `tableId`, `orderIds`, and `payments` for complete context

### 🔧 Technical Improvements

#### Database Schema Updates
- Added `lastResetAt: DateTime?` field to `Table` model for timestamp-based filtering
- Added `serverId: String?` field to `Table` model for server assignment
- Added relation `server` to `Table` model linking to `User` model

#### API Endpoint Updates
- **Order Filtering**: `/api/public/orders` now filters by `lastResetAt` when table session exists
- **Bill Filtering**: `/api/bills/tables/:tableId/bill` filters orders by `lastResetAt` timestamp
- **Table Bills**: `/api/bills/tables` filters orders in calculation logic
- **Server Info**: New `/api/public/tables/:tableId/server` endpoint to get assigned server info

#### Client-Side Improvements
- **Order Store**: Clears orders array when `table_session_revoked` event is received
- **Session Clearing**: Enhanced `clearSession` to remove favorites and customer profile
- **Payment Listener**: Added `payment_processed` socket listener to refresh orders

### 🐛 Bug Fixes
- Fixed issue where old paid orders from previous customers were visible after table reset
- Fixed customer seeing old orders and bills after table reset
- Fixed server bill view showing orders from previous sessions
- Improved session clearing to prevent data leakage between customer sessions

## [Recent Updates] - 2025-01-XX

### 🎨 UI/UX Improvements

#### Server View (Admin Dashboard)
- **Hidden Action Buttons**: Permanent action buttons (Preia Masă/Eliberează, Resetează Masă) are now hidden by default within table cards
- **Settings Toggle**: Added a global Settings icon next to the "Notificări" button in the header to toggle visibility of hidden actions
- **Always Visible Actions**: Frequently used action buttons (Revizuiește, Setează Gata) remain always visible
- **Icon-Based Badges**: Replaced text-based badges with relevant icons:
  - Status badges: `Circle` (Disponibilă), `Clock` (Ocupată), `Receipt` (Notă Cerută), `CheckCircle` (Gata)
  - Ownership badges: `User` (Mea), `UserX` (Liberă), `Users` (Alt server)
  - Order count badges: `Bell` (Review), `CheckCircle` (Ready), `Package` (orders)
- **Removed Redundant Text**: Removed chair count and table shape text from table cards (information is now conveyed visually)
- **Improved Chair Positioning**: Adjusted visual positioning of chairs around tables to be closer to the edge without overlapping, using pixel-based `transform: translate` for precise centering

#### Check Bill View (Customer Side)
- **Conditional Order Selection**: "Selectează Comenzile Mele" and "Selectează Tot" buttons are now hidden when only one order is present
- **Payment Type Tabs**: Replaced `<Select>` component with `Tabs` component for payment type selection
  - Added icons: `DollarSign` for "Numerar" (CASH), `CreditCard` for "Card" (POS)
  - Default payment type: CASH
- **Tip Selection Tabs**: Replaced `<Select>` component with `Tabs` component for tip selection
  - Options: 0%, 10%, 20%, 30%, and "Personalizat" (Custom) with `Banknote` icon
  - Default tip: 20%
- **Custom Tip Drawer**: Implemented custom tip input using `Drawer` and `NumberField` components
  - Opens when "Personalizat" tab is clicked
  - NumberField increments by 5 RON
  - Custom amount is converted to percentage and preserved across bill refreshes
  - Custom tip percentage is maintained even after drawer closes

### 🔧 Technical Improvements

#### Tip Management System
- **Simplified Tip State**: Refactored tip logic to use single `tipPercentage` ref (0 = no tip, 10 = 10%, etc.)
- **Custom Tip Preservation**: Custom tip percentages are preserved across bill refreshes and component re-renders
- **Reactive Guards**: Added watchers and flags to prevent unwanted tip resets after custom tip application
- **Server-Side Integration**: Custom tip percentage from client request is automatically added to server's tip dropdown as "X% (Client)" option

#### Component Updates
- **shadcn-vue Components**: Integrated new components:
  - `Tabs`, `TabsList`, `TabsTrigger` for payment type and tip selection
  - `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, `DrawerClose` for custom tip input
  - `NumberField`, `NumberFieldContent`, `NumberFieldInput`, `NumberFieldIncrement`, `NumberFieldDecrement` for custom tip amount input

### 🐛 Bug Fixes
- Fixed custom tip resetting to previous values after drawer closes
- Fixed custom tip tab not staying selected after applying custom amount
- Fixed tip percentage exceeding 30% being reset to 30%
- Improved tip state management to prevent reactive loops

### 📝 Code Quality
- Improved chair positioning algorithm for better visual representation
- Enhanced table drawing background color matching with card status
- Better state management for tip selection and preservation

---

## Previous Features

### Core Features
- ✅ Multi-tenant restaurant management
- ✅ QR code generation per table
- ✅ Real-time order updates via Socket.IO
- ✅ Live orders board for admins
- ✅ Kitchen display mode (fullscreen)
- ✅ PWA support for customer app
- ✅ Table session management
- ✅ Order status tracking
- ✅ Server role and table ownership management
- ✅ Bill request and payment processing
- ✅ Customer profile management (name, gender, avatar)
- ✅ Persistent notifications panel
- ✅ Dark mode support
