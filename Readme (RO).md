# Documentație Tehnică - Budget App

## Prezentare Generală

Budget App este o aplicație web React pentru gestionarea bugetelor departamentale. Permite utilizatorilor să aloce bugete pe departamente, să urmărească cheltuielile și să gestioneze ratele de schimb valutar. Aplicația include autentificare utilizatori și funcționalități administrative.

## Tehnologii Utilizate

- **React 18** - Framework UI
- **React Router** - Navigare între pagini
- **Firebase/Firestore** - Bază de date și autentificare
- **Bootstrap 5** - Framework CSS
- **Context API** - State management global

## Structura Proiectului

```
Budget_app/
├── public/
│   ├── index.html           # HTML principal
│   └── manifest.json        # Manifest PWA
├── src/
│   ├── components/          # Componente React
│   │   ├── AllocationForm.js      # Formular alocare buget departamente
│   │   ├── Budget.js              # Afișare și editare buget total
│   │   ├── CartValue.js           # Componenta nefolosită (legacy)
│   │   ├── Currencies.js          # Selector monedă
│   │   ├── Currencies.css         # Stiluri selector monedă
│   │   ├── ExchangeRates.js       # Gestionare rate schimb (admin only)
│   │   ├── ExpenseChart.js        # Grafic cheltuieli (Recharts)
│   │   ├── ExpenseItem.js         # Rând individual în tabel cheltuieli
│   │   ├── ExpenseList.js         # Tabel complet cheltuieli
│   │   ├── Login.js               # Pagină autentificare
│   │   ├── Login.css              # Stiluri pagină login
│   │   ├── Navigation.js          # Bară navigare cu dropdown user
│   │   ├── Navigation.css         # Stiluri navbar
│   │   ├── Remaining.js           # Afișare buget rămas
│   │   ├── Settings.js            # Setări utilizator + admin users
│   │   ├── Spent.js               # Afișare total cheltuit
│   │   └── TotalSpent.js          # Componenta legacy cheltuieli
│   ├── context/
│   │   └── AppContext.js          # Context global și reducer
│   ├── firebase.js                # Configurare Firebase
│   ├── App.js                     # Componenta root cu routing
│   ├── App.css                    # Stiluri globale aplicație
│   ├── index.js                   # Entry point React
│   └── index.css                  # Stiluri globale CSS
├── package.json                   # Dependințe npm
└── README.md                      # Documentație utilizare

```

## Arhitectură Aplicație

### 1. State Management (AppContext.js)

Aplicația folosește Context API pentru state management global:

**State Global:**

- `Budget` - Bugetul total în EUR
- `expenses` - Array cu cheltuieli pe departamente
- `Currency` - Moneda curentă selectată (EUR, USD, RON, GBP)
- `exchangeRates` - Obiect cu ratele de schimb

**Reducer Actions:**

- `ADD_QUANTITY` - Adaugă sumă la un departament
- `RED_QUANTITY` - Reduce sumă de la un departament
- `DELETE_ITEM` - Șterge cheltuială departament
- `CHG_BUDGET` - Modifică bugetul total
- `CHG_CURRENCY` - Schimbă moneda afișată
- `SET_EXCHANGE_RATES` - Actualizează ratele de schimb

**Persistență:**

- State-ul se salvează automat în `localStorage` sub cheia `budget-app-state`
- La încărcare, se restaurează datele din localStorage

### 2. Autentificare și Utilizatori (Firebase/Firestore)

**Colecția "users" în Firestore:**

```javascript
{
  username: string,        // Nume utilizator unic
  Name: string,           // Numele complet
  Email: string,          // Adresa email
  password: string,       // Parolă plaintext (doar demo!)
  admin_rights: boolean   // Drepturi administrative
}
```

**Flow autentificare:**

1. Login.js verifică username/password în Firestore
2. La succes, salvează user în `localStorage` cu cheia `loggedUser`
3. App.js verifică prezența user la fiecare render
4. Navigation.js afișează username-ul din localStorage

**Drepturi Admin:**

- Editare rate de schimb (ExchangeRates.js)
- Adăugare utilizatori noi (Settings.js)
- Editare utilizatori existenți (Settings.js)
- Modificare drepturi admin altor utilizatori

### 3. Routing (React Router)

```javascript
/ (root)           → Dashboard principal (AllocationForm + ExpenseList + Charts)
/login             → Pagină autentificare
/settings          → Setări utilizator și admin
/exchange-rates    → Gestionare rate schimb (admin only)
```

**Protected Routes:**

- Toate rutele (exceptând `/login`) verifică prezența utilizatorului logat
- Redirect automat la `/login` dacă user nu este autentificat

### 4. Componente Principale

#### **App.js**

- Componenta root care gestionează routing-ul
- Verifică autentificarea utilizatorului
- Afișează Navigation + conținutul specific rutei
- Învelește totul în AppProvider pentru acces la context

#### **Login.js**

- Formular autentificare cu username/password
- Verificare credențiale în Firestore
- Salvare utilizator în localStorage
- Redirect la dashboard după login cu succes
- Stilizat cu tema blue/gold matching navbar

#### **Navigation.js**

- Navbar Bootstrap cu meniu dropdown pentru user
- Afișare nume utilizator din setări
- Opțiuni: Settings, Exchange Rates (admin), Logout
- Event listener pentru actualizare nume la schimbare setări
- Link-uri cu React Router

#### **Settings.js**

- **Trei secțiuni (3 coloane egale):**
  1. **Settings for:** - Setări utilizator curent
     - Username (readonly)
     - Name, Email (editabile)
     - Actual password, New password, Confirm password
     - Administrative rights checkbox (doar admin poate modifica)
     - Dialog confirmare la scoatere drepturi admin

  2. **Add new user** - Adăugare utilizatori (doar admin)
     - Username, Name, Email
     - New password, Confirm password
     - Administrative rights checkbox
     - Validare completare câmpuri obligatorii
     - Salvare în Firestore + actualizare listă locală

  3. **Edit users** - Editare utilizatori (doar admin)
     - Username dropdown (populat din Firestore)
     - Auto-completare Name, Email, Admin rights la selectare
     - Opțional: New password, Confirm password
     - Salvare modificări în Firestore

- Toate operațiile admin sunt protejate (verificare drepturi)
- Câmpurile sunt disabled/grayed out pentru non-admin
- Lista utilizatori încărcată la mount și actualizată după add/edit

#### **ExchangeRates.js**

- Afișare și editare rate de schimb valutar
- 4 monede: EUR (bază), USD, RON, GBP
- Butoane increment/decrement pentru ajustare rate
- Salvare în Firestore (colecția "exchange_rates")
- Sincronizare cu AppContext la modificare
- **Protecție admin:** controale disabled pentru non-admin

#### **Budget.js**

- Input pentru setare buget total
- Validare: buget > suma cheltuită
- Conversie automată la schimbare monedă
- Salvare în context la modificare

#### **AllocationForm.js**

- Formular alocare bugete pe departamente
- Selector departament (Marketing, Sales, Finance, HR, IT, Admin)
- Acțiune: Add/Reduce
- Input sumă în moneda curentă
- Validare: nu depăși bugetul rămas la Add
- Dispatch acțiuni ADD_QUANTITY / RED_QUANTITY

#### **ExpenseList.js**

- Tabel Bootstrap cu cheltuieli pe departamente
- Coloane: Department, Allocated Budget, Delete
- Buton delete pentru fiecare departament
- Conversie automată valori la schimbare monedă
- Sortare alfabetică departamente

#### **Remaining.js & Spent.js**

- Card-uri Bootstrap pentru buget rămas / cheltuit
- Calcul dinamic din expenses
- Culoare dinamică: verde (rămas > 0), roșu (deficit)
- Conversie automată la schimbare monedă

#### **Currencies.js**

- Dropdown pentru selectare monedă
- 4 opțiuni: £ GBP, $ USD, € EUR, RON lei
- Dispatch CHG_CURRENCY la schimbare
- Sincronizare cu flag icons în dropdown

#### **ExpenseChart.js**

- Grafic pie chart cu Recharts
- Distribuție cheltuieli pe departamente
- Culori distinctive pentru fiecare departament
- Legendă interactivă
- Responsive design

### 5. Firebase Configuration (firebase.js)

```javascript
// Configurare Firebase
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ... alte configurări
};

// Inițializare Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
```

**Colecții Firestore:**

- `users` - Utilizatori aplicație
- `exchange_rates` - Rate schimb valutar (document unic cu ID "current_rates")

## Fluxuri Principale

### 1. Login Flow

```
User accesează /login
  → Introduce username/password
  → Login.js query Firestore collection "users"
  → Verificare credențiale
  → Dacă valid:
     - Salvare user în localStorage
     - Redirect la /
  → Dacă invalid:
     - Mesaj eroare
```

### 2. Alocare Buget Flow

```
User completează AllocationForm
  → Selectează departament + sumă + acțiune (Add/Reduce)
  → Validare: buget rămas suficient (pentru Add)
  → Dispatch acțiune la reducer
  → Reducer actualizează expenses array
  → Salvare în localStorage
  → Re-render componente: ExpenseList, Remaining, Spent, ExpenseChart
```

### 3. Schimbare Monedă Flow

```
User selectează monedă din Currencies dropdown
  → Dispatch CHG_CURRENCY
  → Reducer actualizează state Currency
  → Toate componentele care afișează sume recalculează cu noua monedă
  → Folosesc funcțiile convertFromEur / convertToEur din ExchangeRates
```

### 4. Editare Rate Schimb (Admin) Flow

```
Admin accesează /exchange-rates
  → ExchangeRates.js verifică admin_rights
  → Dacă admin: butoane enabled
  → Admin modifică rate cu +/-
  → Click Save: salvare în Firestore + actualizare AppContext
  → Toate sumele din app se recalculează cu noile rate
```

### 5. Adăugare Utilizator (Admin) Flow

```
Admin în Settings → Add new user
  → Completează formular (username, name, email, password, admin rights)
  → Validare câmpuri
  → addDoc în Firestore collection "users"
  → Actualizare listă locală usersList
  → Resetare formular + mesaj succes
```

### 6. Editare Utilizator (Admin) Flow

```
Admin în Settings → Edit users
  → Selectează username din dropdown
  → Auto-fill Name, Email, Admin rights din Firestore
  → Modifică câmpurile dorite (opțional password)
  → Click Save Changes
  → updateDoc în Firestore
  → Actualizare listă locală usersList
  → Mesaj succes
```

## Funcții Utilitare

### Conversie Monedă (ExchangeRates.js)

```javascript
// Conversie din EUR în moneda selectată
convertFromEur(amount, currency)
  → Înmulțește amount cu rata corespunzătoare
  → Rotunjește la 2 zecimale
  → Returnează număr

// Conversie din moneda selectată în EUR
convertToEur(amount, currency)
  → Împarte amount la rata corespunzătoare
  → Rotunjește la 2 zecimale
  → Returnează număr
```

## Stilizare

### App.css

- Container max-width: 1400px (pentru layout Settings 3 coloane)
- Card-like: stiluri pentru card-uri cu border și shadow
- Stiluri form-control, buttons (Bootstrap customizat)
- Variabile CSS pentru culori (--bg-surface, --text-strong, etc.)
- Stiluri hover/active pentru butoane

### Navigation.css

- Navbar gradient albastru
- Dropdown menu cu hover effects
- Text auriu pentru nume utilizator
- Stiluri responsive

### Login.css

- Layout centrat cu card
- Gradient background matching navbar
- Form stilizat
- Responsive design

### Currencies.css

- Dropdown custom pentru selector monedă
- Flag icons pentru fiecare monedă
- Hover states

## Securitate

⚠️ **IMPORTANT - Doar pentru DEMO:**

1. **Parolele în plaintext** - stocate fără hash în Firestore
   - NU folosiți în producție!
   - Implementați Firebase Authentication pentru producție

2. **Admin rights simplificat** - boolean în document user
   - Considerați Firebase Security Rules pentru producție

3. **Rate limiter absent** - nu există protecție brute-force
   - Implementați rate limiting pentru login în producție

4. **CORS și Firebase rules** - configurați restrictiv în producție

## Optimizări Posibile

1. **Lazy loading** pentru componente (React.lazy)
2. **Memoization** pentru componente complexe (React.memo)
3. **Debounce** pentru input-urile de buget
4. **Service Worker** pentru funcționalitate offline
5. **Firebase Authentication** în loc de verificare manuală
6. **TypeScript** pentru type safety
7. **Unit tests** cu Jest și React Testing Library
8. **E2E tests** cu Cypress sau Playwright

## Comenzi Utile

```bash
# Instalare dependințe
npm install

# Rulare development server
npm start

# Build pentru producție
npm run build

# Rulare teste (dacă există)
npm test
```

## Variabile Mediu

Creați fișier `.env.local` cu configurarea Firebase:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Mentenanță și Development

### Adăugare Departament Nou

1. Modificați `initialState.expenses` în `AppContext.js`
2. Adăugați opțiunea în `<select>` din `AllocationForm.js`
3. Adăugați culoare în `ExpenseChart.js` (array COLORS)

### Adăugare Monedă Nouă

1. Adăugați rata în `initialState.exchangeRates` din `AppContext.js`
2. Adăugați opțiunea în `Currencies.js`
3. Adăugați input în `ExchangeRates.js`
4. Actualizați funcțiile `convertFromEur` și `convertToEur`

### Debugging

- State global: inspectați `window.localStorage.getItem('budget-app-state')`
- User logat: `window.localStorage.getItem('loggedUser')`
- React DevTools pentru component tree
- Firestore console pentru date backend

---

**Versiune:** 1.0  
**Data ultimei actualizări:** Ianuarie 2026
