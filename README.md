# Technical Documentation - Budget App

## Overview

Budget App is a React web application for managing departmental budgets. It allows users to allocate budgets to departments, track expenses, and manage currency exchange rates. The application includes user authentication and administrative features.

## Technologies Used

- **React 18** - UI Framework
- **React Router** - Page navigation
- **Firebase/Firestore** - Database and authentication
- **Bootstrap 5** - CSS Framework
- **Context API** - Global state management

## Project Structure

```
Budget_app/
├── public/
│   ├── index.html           # Main HTML
│   └── manifest.json        # PWA Manifest
├── src/
│   ├── components/          # React Components
│   │   ├── AllocationForm.js      # Department budget allocation form
│   │   ├── Budget.js              # Display and edit total budget
│   │   ├── CartValue.js           # Unused component (legacy)
│   │   ├── Currencies.js          # Currency selector
│   │   ├── Currencies.css         # Currency selector styles
│   │   ├── ExchangeRates.js       # Exchange rate management (admin only)
│   │   ├── ExpenseChart.js        # Expense chart (Recharts)
│   │   ├── ExpenseItem.js         # Individual row in expense table
│   │   ├── ExpenseList.js         # Complete expense table
│   │   ├── Login.js               # Authentication page
│   │   ├── Login.css              # Login page styles
│   │   ├── Navigation.js          # Navigation bar with user dropdown
│   │   ├── Navigation.css         # Navbar styles
│   │   ├── Remaining.js           # Display remaining budget
│   │   ├── Settings.js            # User settings + admin users
│   │   ├── Spent.js               # Display total spent
│   │   └── TotalSpent.js          # Legacy expense component
│   ├── context/
│   │   └── AppContext.js          # Global context and reducer
│   ├── firebase.js                # Firebase configuration
│   ├── App.js                     # Root component with routing
│   ├── App.css                    # Global application styles
│   ├── index.js                   # React entry point
│   └── index.css                  # Global CSS styles
├── package.json                   # npm dependencies
└── README.md                      # Usage documentation

```

## Application Architecture

### 1. State Management (AppContext.js)

The application uses Context API for global state management:

**Global State:**

- `Budget` - Total budget in EUR
- `expenses` - Array with department expenses
- `Currency` - Currently selected currency (EUR, USD, RON, GBP)
- `exchangeRates` - Object with exchange rates

**Reducer Actions:**

- `ADD_QUANTITY` - Add amount to a department
- `RED_QUANTITY` - Reduce amount from a department
- `DELETE_ITEM` - Delete department expense
- `CHG_BUDGET` - Modify total budget
- `CHG_CURRENCY` - Change displayed currency
- `SET_EXCHANGE_RATES` - Update exchange rates

**Persistence:**

- State automatically saves to `localStorage` under the key `budget-app-state`
- On load, data is restored from localStorage

### 2. Authentication and Users (Firebase/Firestore)

**Firestore "users" collection:**

```javascript
{
  username: string,        // Unique username
  Name: string,           // Full name
  Email: string,          // Email address
  password: string,       // Plaintext password (demo only!)
  admin_rights: boolean   // Administrative rights
}
```

**Authentication flow:**

1. Login.js verifies username/password in Firestore
2. On success, saves user to `localStorage` with key `loggedUser`
3. App.js checks for user presence on each render
4. Navigation.js displays username from localStorage

**Admin Rights:**

- Edit exchange rates (ExchangeRates.js)
- Add new users (Settings.js)
- Edit existing users (Settings.js)
- Modify admin rights for other users

### 3. Routing (React Router)

```javascript
/ (root)           → Main dashboard (AllocationForm + ExpenseList + Charts)
/login             → Authentication page
/settings          → User settings and admin
/exchange-rates    → Exchange rate management (admin only)
```

**Protected Routes:**

- All routes (except `/login`) check for logged-in user
- Automatic redirect to `/login` if user is not authenticated

### 4. Main Components

#### **App.js**

- Root component that manages routing
- Verifies user authentication
- Displays Navigation + route-specific content
- Wraps everything in AppProvider for context access

#### **Login.js**

- Authentication form with username/password
- Credential verification in Firestore
- Save user to localStorage
- Redirect to dashboard after successful login
- Styled with blue/gold theme matching navbar

#### **Navigation.js**

- Bootstrap navbar with user dropdown menu
- Display username from settings
- Options: Settings, Exchange Rates (admin), Logout
- Event listener for name updates on settings change
- Links with React Router

#### **Settings.js**

- **Three sections (3 equal columns):**
  1. **Settings for:** - Current user settings
     - Username (readonly)
     - Name, Email (editable)
     - Actual password, New password, Confirm password
     - Administrative rights checkbox (only admin can modify)
     - Confirmation dialog when removing admin rights

  2. **Add new user** - Add users (admin only)
     - Username, Name, Email
     - New password, Confirm password
     - Administrative rights checkbox
     - Validation for required fields
     - Save to Firestore + update local list

  3. **Edit users** - Edit users (admin only)
     - Username dropdown (populated from Firestore)
     - Auto-fill Name, Email, Admin rights on selection
     - Optional: New password, Confirm password
     - Save changes to Firestore

- All admin operations are protected (rights verification)
- Fields are disabled/grayed out for non-admin
- User list loaded on mount and updated after add/edit

#### **ExchangeRates.js**

- Display and edit currency exchange rates
- 4 currencies: EUR (base), USD, RON, GBP
- Increment/decrement buttons for rate adjustment
- Save to Firestore (collection "exchange_rates")
- Sync with AppContext on change
- **Admin protection:** controls disabled for non-admin

#### **Budget.js**

- Input for setting total budget
- Validation: budget > spent amount
- Automatic conversion on currency change
- Save to context on change

#### **AllocationForm.js**

- Budget allocation form for departments
- Department selector (Marketing, Sales, Finance, HR, IT, Admin)
- Action: Add/Reduce
- Amount input in current currency
- Validation: don't exceed remaining budget on Add
- Dispatch ADD_QUANTITY / RED_QUANTITY actions

#### **ExpenseList.js**

- Bootstrap table with department expenses
- Columns: Department, Allocated Budget, Delete
- Delete button for each department
- Automatic value conversion on currency change
- Alphabetical department sorting

#### **Remaining.js & Spent.js**

- Bootstrap cards for remaining / spent budget
- Dynamic calculation from expenses
- Dynamic color: green (remaining > 0), red (deficit)
- Automatic conversion on currency change

#### **Currencies.js**

- Dropdown for currency selection
- 4 options: £ GBP, $ USD, € EUR, RON lei
- Dispatch CHG_CURRENCY on change
- Sync with flag icons in dropdown

#### **ExpenseChart.js**

- Pie chart with Recharts
- Distribution of expenses by department
- Distinctive colors for each department
- Interactive legend
- Responsive design

### 5. Firebase Configuration (firebase.js)

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ... other configurations
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
```

**Firestore Collections:**

- `users` - Application users
- `exchange_rates` - Currency exchange rates (single document with ID "current_rates")

## Main Flows

### 1. Login Flow

```
User accesses /login
  → Enters username/password
  → Login.js queries Firestore collection "users"
  → Credential verification
  → If valid:
     - Save user to localStorage
     - Redirect to /
  → If invalid:
     - Error message
```

### 2. Budget Allocation Flow

```
User completes AllocationForm
  → Selects department + amount + action (Add/Reduce)
  → Validation: sufficient remaining budget (for Add)
  → Dispatch action to reducer
  → Reducer updates expenses array
  → Save to localStorage
  → Re-render components: ExpenseList, Remaining, Spent, ExpenseChart
```

### 3. Currency Change Flow

```
User selects currency from Currencies dropdown
  → Dispatch CHG_CURRENCY
  → Reducer updates Currency state
  → All components displaying amounts recalculate with new currency
  → Use convertFromEur / convertToEur functions from ExchangeRates
```

### 4. Edit Exchange Rates (Admin) Flow

```
Admin accesses /exchange-rates
  → ExchangeRates.js checks admin_rights
  → If admin: buttons enabled
  → Admin modifies rates with +/-
  → Click Save: save to Firestore + update AppContext
  → All amounts in app recalculate with new rates
```

### 5. Add User (Admin) Flow

```
Admin in Settings → Add new user
  → Completes form (username, name, email, password, admin rights)
  → Field validation
  → addDoc to Firestore collection "users"
  → Update local usersList
  → Reset form + success message
```

### 6. Edit User (Admin) Flow

```
Admin in Settings → Edit users
  → Selects username from dropdown
  → Auto-fill Name, Email, Admin rights from Firestore
  → Modifies desired fields (optional password)
  → Click Save Changes
  → updateDoc in Firestore
  → Update local usersList
  → Success message
```

## Utility Functions

### Currency Conversion (ExchangeRates.js)

```javascript
// Convert from EUR to selected currency
convertFromEur(amount, currency)
  → Multiplies amount by corresponding rate
  → Rounds to 2 decimals
  → Returns number

// Convert from selected currency to EUR
convertToEur(amount, currency)
  → Divides amount by corresponding rate
  → Rounds to 2 decimals
  → Returns number
```

## Styling

### App.css

- Container max-width: 1400px (for Settings 3-column layout)
- Card-like: styles for cards with border and shadow
- Form-control, button styles (customized Bootstrap)
- CSS variables for colors (--bg-surface, --text-strong, etc.)
- Hover/active styles for buttons

### Navigation.css

- Blue gradient navbar
- Dropdown menu with hover effects
- Gold text for username
- Responsive styles

### Login.css

- Centered layout with card
- Gradient background matching navbar
- Styled form
- Responsive design

### Currencies.css

- Custom dropdown for currency selector
- Flag icons for each currency
- Hover states

## Security

⚠️ **IMPORTANT - DEMO ONLY:**

1. **Plaintext passwords** - stored without hashing in Firestore
   - DO NOT use in production!
   - Implement Firebase Authentication for production

2. **Simplified admin rights** - boolean in user document
   - Consider Firebase Security Rules for production

3. **No rate limiter** - no brute-force protection
   - Implement rate limiting for login in production

4. **CORS and Firebase rules** - configure restrictively in production

## Possible Optimizations

1. **Lazy loading** for components (React.lazy)
2. **Memoization** for complex components (React.memo)
3. **Debounce** for budget inputs
4. **Service Worker** for offline functionality
5. **Firebase Authentication** instead of manual verification
6. **TypeScript** for type safety
7. **Unit tests** with Jest and React Testing Library
8. **E2E tests** with Cypress or Playwright

## Useful Commands

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build

# Run tests (if any)
npm test
```

## Environment Variables

Create `.env.local` file with Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Maintenance and Development

### Adding a New Department

1. Modify `initialState.expenses` in `AppContext.js`
2. Add option in `<select>` in `AllocationForm.js`
3. Add color in `ExpenseChart.js` (COLORS array)

### Adding a New Currency

1. Add rate to `initialState.exchangeRates` in `AppContext.js`
2. Add option in `Currencies.js`
3. Add input in `ExchangeRates.js`
4. Update `convertFromEur` and `convertToEur` functions

### Debugging

- Global state: inspect `window.localStorage.getItem('budget-app-state')`
- Logged user: `window.localStorage.getItem('loggedUser')`
- React DevTools for component tree
- Firestore console for backend data

---

**Version:** 1.0  
**Last Updated:** January 2026
