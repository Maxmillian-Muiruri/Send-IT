export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'courier';
  // Add any other fields you need
} 