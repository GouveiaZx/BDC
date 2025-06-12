// Sistema de armazenamento compartilhado para usuários
// Permite que as APIs de login e registro compartilhem dados

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  account_type: string;
  created_at: string;
}

// Usuários mock/demo pré-definidos
const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@buscaaquibdc.com.br',
    name: 'Administrador BDC',
    account_type: 'admin',
    password: 'admin123',
    created_at: '2025-01-20T10:00:00.000Z'
  },
  {
    id: 'user-demo',
    email: 'demo@buscaaquibdc.com.br', 
    name: 'Usuário Demo',
    account_type: 'personal',
    password: 'demo123',
    created_at: '2025-01-20T11:00:00.000Z'
  }
];

// Usuários registrados dinamicamente
let registeredUsers: User[] = [...mockUsers];

export const UserStorage = {
  // Adicionar novo usuário
  addUser: (user: User): boolean => {
    try {
      // Verificar se email já existe
      const existingUser = registeredUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (existingUser) {
        return false; // Email já existe
      }
      
      registeredUsers.push(user);
      console.log('✅ Usuário adicionado ao storage:', { email: user.email, total: registeredUsers.length });
      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      return false;
    }
  },

  // Buscar usuário por email
  findUserByEmail: (email: string): User | undefined => {
    return registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Verificar credenciais de login
  verifyCredentials: (email: string, password: string): User | null => {
    const user = registeredUsers.find(user => 
      user.email.toLowerCase() === email.toLowerCase() && 
      user.password === password
    );
    return user || null;
  },

  // Listar todos os usuários (sem senhas)
  getAllUsers: (): Omit<User, 'password'>[] => {
    return registeredUsers.map(({ password, ...user }) => user);
  },

  // Obter estatísticas
  getStats: () => {
    return {
      total: registeredUsers.length,
      mock_users: mockUsers.length,
      registered_users: registeredUsers.length - mockUsers.length,
      account_types: {
        admin: registeredUsers.filter(u => u.account_type === 'admin').length,
        personal: registeredUsers.filter(u => u.account_type === 'personal').length,
        business: registeredUsers.filter(u => u.account_type === 'business').length
      }
    };
  },

  // Verificar se email existe
  emailExists: (email: string): boolean => {
    return registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  }
};

export type { User }; 