// Simple browser-only authentication system

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Simple authentication - hardcoded credentials for demo
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Demo credentials
  const validUsers = [
    {
      email: 'admin@sigma-hq.com',
      password: 'admin123',
      user: { id: '1', email: 'admin@sigma-hq.com', name: 'Admin User' }
    },
    {
      email: 'riccardo.uccellini@sigmadigitalagency.it',
      password: 'RiccardoSigma123.',
      user: { id: '2', email: 'riccardo.uccellini@sigmadigitalagency.it', name: 'Riccardo Uccellini' }
    }
  ];
  
  const validUser = validUsers.find(u => u.email === email && u.password === password);
  return validUser ? validUser.user : null;
}

// Session management using localStorage
export function saveUserSession(user: User) {
  localStorage.setItem('sigma-hq-user', JSON.stringify(user));
}

export function getUserSession(): User | null {
  try {
    const userStr = localStorage.getItem('sigma-hq-user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function clearUserSession() {
  localStorage.removeItem('sigma-hq-user');
}
