"use client";

import React, { Suspense } from 'react';
import AuthForm from '../components/AuthForm';

function LoginContent() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <AuthForm initialMode="login" />
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 