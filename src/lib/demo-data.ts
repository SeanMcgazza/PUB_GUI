// Demo data for testing UI/UX without Supabase

export const DEMO_PUB = {
  id: 'demo-pub-id',
  owner_id: 'demo-owner-id',
  name: "The Local",
  slug: 'the-local',
  address: '123 Main Street, Dublin',
  phone: '+353 1 234 5678',
  logo_url: null,
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_TABLES = [
  { id: 't1', pub_id: DEMO_PUB.id, number: 1, name: 'Window Seat', qr_token: 'table1', status: 'available' },
  { id: 't2', pub_id: DEMO_PUB.id, number: 2, name: 'Corner Booth', qr_token: 'table2', status: 'occupied' },
  { id: 't3', pub_id: DEMO_PUB.id, number: 3, name: 'Bar Stool 1', qr_token: 'table3', status: 'available' },
  { id: 't4', pub_id: DEMO_PUB.id, number: 4, name: 'Patio Table', qr_token: 'table4', status: 'available' },
  { id: 't5', pub_id: DEMO_PUB.id, number: 5, name: 'High Top', qr_token: 'table5', status: 'reserved' },
];

export const DEMO_CATEGORIES = [
  { id: 'cat1', pub_id: DEMO_PUB.id, name: 'Draught Beer', order: 1 },
  { id: 'cat2', pub_id: DEMO_PUB.id, name: 'Bottled Beer', order: 2 },
  { id: 'cat3', pub_id: DEMO_PUB.id, name: 'Spirits', order: 3 },
  { id: 'cat4', pub_id: DEMO_PUB.id, name: 'Wine', order: 4 },
  { id: 'cat5', pub_id: DEMO_PUB.id, name: 'Soft Drinks', order: 5 },
  { id: 'cat6', pub_id: DEMO_PUB.id, name: 'Food', order: 6 },
];

export const DEMO_MENU_ITEMS = [
  // Draught Beer
  { id: 'm1', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Guinness', description: 'The black stuff. 568ml pint.', price: 5.80, is_available: true },
  { id: 'm2', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Heineken', description: 'Crisp lager. 568ml pint.', price: 5.50, is_available: true },
  { id: 'm3', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Smithwicks', description: 'Irish red ale. 568ml pint.', price: 5.20, is_available: true },
  { id: 'm4', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Rockshore', description: 'Refreshing lager. 568ml pint.', price: 5.00, is_available: true },
  
  // Bottled Beer
  { id: 'm5', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Corona', description: '330ml bottle', price: 5.00, is_available: true },
  { id: 'm6', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Budweiser', description: '330ml bottle', price: 4.80, is_available: true },
  { id: 'm7', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Hop House 13', description: '330ml bottle', price: 5.20, is_available: true },
  
  // Spirits
  { id: 'm8', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Jameson', description: 'Irish whiskey. Single measure.', price: 5.50, is_available: true },
  { id: 'm9', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Jameson Double', description: 'Irish whiskey. Double measure.', price: 9.50, is_available: true },
  { id: 'm10', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Vodka & Mixer', description: 'Smirnoff with your choice of mixer', price: 6.50, is_available: true },
  { id: 'm11', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Gin & Tonic', description: 'Gordons with Schweppes tonic', price: 7.00, is_available: true },
  
  // Wine
  { id: 'm12', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'House Red', description: '175ml glass', price: 6.50, is_available: true },
  { id: 'm13', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'House White', description: '175ml glass', price: 6.50, is_available: true },
  { id: 'm14', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'Prosecco', description: '200ml bottle', price: 8.00, is_available: true },
  
  // Soft Drinks
  { id: 'm15', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Coca Cola', description: '330ml', price: 3.00, is_available: true },
  { id: 'm16', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Diet Coke', description: '330ml', price: 3.00, is_available: true },
  { id: 'm17', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Club Orange', description: '330ml', price: 3.00, is_available: true },
  { id: 'm18', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Red Bull', description: '250ml can', price: 4.00, is_available: true },
  
  // Food
  { id: 'm19', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Loaded Fries', description: 'Crispy fries with cheese, bacon & scallions', price: 8.50, is_available: true },
  { id: 'm20', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Chicken Wings', description: '8 wings with your choice of sauce', price: 12.00, is_available: true },
  { id: 'm21', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Fish & Chips', description: 'Beer-battered cod with chunky chips', price: 15.00, is_available: true },
  { id: 'm22', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Beef Burger', description: '6oz patty, bacon, cheese, brioche bun', price: 14.50, is_available: true },
];

export const DEMO_ORDERS = [
  {
    id: 'o1',
    pub_id: DEMO_PUB.id,
    table_id: 't2',
    session_token: 'sess1',
    status: 'pending',
    confirmation_code: '4521',
    total: 16.80,
    notes: '',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 min ago
    order_items: [
      { id: 'oi1', name: 'Guinness', price: 5.80, quantity: 2, notes: '' },
      { id: 'oi2', name: 'Heineken', price: 5.50, quantity: 1, notes: '' },
    ],
    tables: { number: 2, name: 'Corner Booth' },
  },
  {
    id: 'o2',
    pub_id: DEMO_PUB.id,
    table_id: 't1',
    session_token: 'sess2',
    status: 'accepted',
    confirmation_code: '7834',
    total: 23.50,
    notes: 'No ice in the coke please',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
    order_items: [
      { id: 'oi3', name: 'Jameson Double', price: 9.50, quantity: 1, notes: '' },
      { id: 'oi4', name: 'Coca Cola', price: 3.00, quantity: 1, notes: 'No ice' },
      { id: 'oi5', name: 'Chicken Wings', price: 12.00, quantity: 1, notes: 'BBQ sauce' },
    ],
    tables: { number: 1, name: 'Window Seat' },
  },
  {
    id: 'o3',
    pub_id: DEMO_PUB.id,
    table_id: 't4',
    session_token: 'sess3',
    status: 'preparing',
    confirmation_code: '9156',
    total: 29.50,
    notes: '',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(), // 12 min ago
    order_items: [
      { id: 'oi6', name: 'Fish & Chips', price: 15.00, quantity: 1, notes: '' },
      { id: 'oi7', name: 'Beef Burger', price: 14.50, quantity: 1, notes: 'Medium rare' },
    ],
    tables: { number: 4, name: 'Patio Table' },
  },
];

// Check if we're in demo mode
// For now, always return true since we're in demo/testing phase
// When ready for production, check: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
export const isDemoMode = () => {
  return true;
};
