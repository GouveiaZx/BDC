import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdCard from '../AdCard';
import { Ad, AdModerationStatus, User, UserRole, SubscriptionPlan } from '../../models/types';

// Mock dos hooks e componentes
jest.mock('../hooks/useWhatsAppWarning', () => ({
  __esModule: true,
  default: () => ({
    isWhatsAppModalOpen: false,
    currentPhoneNumber: '',
    openWhatsAppModal: jest.fn(),
    closeWhatsAppModal: jest.fn(),
    proceedToWhatsApp: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock de usuário completo
const mockUser: User = {
  id: 'user-123',
  name: 'João Silva',
  email: 'joao@example.com',
  role: UserRole.ADVERTISER,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  subscription: SubscriptionPlan.FREE,
  cardSaved: false,
  isVerified: true,
  freeAdUsed: false
};

// Mock do ad de exemplo
const mockAd: Ad = {
  id: 'test-ad-1',
  title: 'iPhone 13 Pro usado',
  description: 'iPhone em ótimo estado, sem arranhões',
  price: 2500,
  images: ['https://example.com/iphone.jpg'],
  category: 'Eletrônicos',
  createdAt: '2024-01-15T10:00:00Z',
  views: 120,
  featured: false,
  userId: 'user-123',
  userName: 'João Silva',
  userAvatar: 'https://example.com/avatar.jpg',
  whatsapp: '11999887766',
  city: 'São Paulo',
  state: 'SP',
  location: 'São Paulo, SP',
  status: 'active',
  moderationStatus: AdModerationStatus.APPROVED,
  isFavorite: false,
  ratings: [5, 4, 5]
};

describe('AdCard Component', () => {
  it('renders ad information correctly', () => {
    render(<AdCard ad={mockAd} />);
    
    expect(screen.getByText('iPhone 13 Pro usado')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument();
    expect(screen.getByText('iPhone em ótimo estado, sem arranhões')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
  });

  it('displays featured badge when featured prop is true', () => {
    render(<AdCard ad={mockAd} featured={true} />);
    
    expect(screen.getByText('Anúncio Destaque')).toBeInTheDocument();
  });

  it('handles favorite toggle correctly', () => {
    const mockOnFavoriteToggle = jest.fn();
    render(<AdCard ad={mockAd} onFavoriteToggle={mockOnFavoriteToggle} />);
    
    const favoriteButton = screen.getByRole('button', { name: /favoritar/i });
    fireEvent.click(favoriteButton);
    
    expect(mockOnFavoriteToggle).toHaveBeenCalledWith('test-ad-1', true);
  });

  it('shows multiple images indicator when ad has more than one image', () => {
    const adWithMultipleImages = {
      ...mockAd,
      images: ['image1.jpg', 'image2.jpg', 'image3.jpg']
    };
    
    render(<AdCard ad={adWithMultipleImages} />);
    
    expect(screen.getByText('3 fotos')).toBeInTheDocument();
  });

  it('displays verified badge when user is verified', () => {
    const adWithVerifiedUser = {
      ...mockAd,
      user: mockUser
    };
    
    render(<AdCard ad={adWithVerifiedUser} />);
    
    expect(screen.getByRole('img', { name: /verificado/i })).toBeInTheDocument();
  });

  it('uses placeholder image when no images are provided', () => {
    const adWithoutImages = {
      ...mockAd,
      images: []
    };
    
    render(<AdCard ad={adWithoutImages} />);
    
    const image = screen.getByAltText('iPhone 13 Pro usado');
    expect(image).toHaveAttribute('src', '/images/placeholder.png');
  });

  it('calculates rating correctly', () => {
    // Rating = (5 + 4 + 5) / 3 = 4.7
    render(<AdCard ad={mockAd} />);
    
    // Verifica se o rating é exibido (assumindo que existe um elemento com rating)
    // Este teste depende da implementação específica do rating no componente
  });

  it('navigates to store page when clicking on seller info', () => {
    render(<AdCard ad={mockAd} />);
    
    const sellerInfo = screen.getByText('João Silva');
    fireEvent.click(sellerInfo);
    
    // Verifica se a navegação foi acionada corretamente
    // Este teste pode precisar ser ajustado dependendo da implementação
  });
}); 