"use client";

import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export default function AlterarSenha() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Requisitos de senha
  const passwordRequirements = [
    { id: 'length', label: 'Pelo menos 8 caracteres', test: (pwd: string) => pwd.length >= 8 },
    { id: 'uppercase', label: 'Pelo menos 1 letra maiúscula', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'Pelo menos 1 letra minúscula', test: (pwd: string) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'Pelo menos 1 número', test: (pwd: string) => /[0-9]/.test(pwd) },
    { id: 'special', label: 'Pelo menos 1 caractere especial', test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  // Verificar se a senha atende aos requisitos
  const passwordMeetsRequirements = passwordRequirements.every(req => req.test(newPassword));

  // Verificar se as senhas coincidem
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  // Função para alternar a visibilidade da senha
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  // Função de envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validação básica
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios.');
      setLoading(false);
      return;
    }

    if (!passwordMeetsRequirements) {
      setError('A nova senha não atende a todos os requisitos de segurança.');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('A confirmação da senha não corresponde à nova senha.');
      setLoading(false);
      return;
    }

    try {
      // Simulação de chamada à API para alterar a senha
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulação de sucesso
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Simulação de erro
      setError('Ocorreu um erro ao alterar a senha. Verifique se a senha atual está correta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <FaLock className="mr-2" /> Alterar Senha
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-xl mx-auto">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaCheck className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Senha alterada com sucesso!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Sua senha foi alterada com sucesso. Para sua segurança, utilize esta nova senha para seu próximo login.</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                    onClick={() => setSuccess(false)}
                  >
                    Alterar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro ao alterar senha</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite sua senha atual"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite sua nova senha"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Requisitos de senha */}
            <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Requisitos de senha:</p>
              <ul className="space-y-1">
                {passwordRequirements.map((req) => (
                  <li key={req.id} className="flex items-center text-sm">
                    {req.test(newPassword) ? (
                      <FaCheck className="text-green-500 mr-2" />
                    ) : (
                      <FaTimes className="text-red-500 mr-2" />
                    )}
                    <span className={req.test(newPassword) ? "text-green-700" : "text-gray-600"}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    confirmPassword
                      ? passwordsMatch
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirme sua nova senha"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">As senhas não coincidem.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition duration-300 flex items-center ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 