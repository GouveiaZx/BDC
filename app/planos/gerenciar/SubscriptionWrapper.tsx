"use client";

import React from 'react';
import { SubscriptionProvider } from '../../lib/subscriptionContext';
import ManageSubscriptionClient from './ManageSubscriptionClient';
import { User, UserRole } from '../../models/types';

interface SubscriptionWrapperProps {
  user: {
    id: string;
    name: string;
    email: string;
    subscription: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  };
}

export default function SubscriptionWrapper({ user }: SubscriptionWrapperProps) {
  // Converter os dados do usuário para o formato esperado pelo SubscriptionProvider
  const userForProvider: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: UserRole.ADVERTISER,
    subscription: user.subscription as any,
    subscriptionStartDate: user.subscriptionStartDate,
    subscriptionEndDate: user.subscriptionEndDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    cardSaved: false,
    freeAdUsed: false
  };

  return (
    <SubscriptionProvider user={userForProvider}>
      <ManageSubscriptionClient user={user} />
    </SubscriptionProvider>
  );
} 