"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaGoogle, FaFacebook, FaBuilding, FaBriefcase, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
import { signInWithGoogle, signInWithFacebook, signInWithEmail, signUp, signOut } from '../lib/auth';
import { directRegister, directLogin } from '../lib/directAuth';
import { saveUserProfile, saveBusinessProfile } from '../lib/profile';

type AuthMode = 'login' | 'register';
type AccountType = 'personal' | 'business';
type RegisterStep = 'account-type' | 'personal-info' | 'company-info' | 'contact-info' | 'password';

interface AuthFormProps {
  initialMode?: AuthMode;
}

const AuthForm: React.FC<AuthFormProps> = ({ initialMode = 'login' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('account-type');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    terms: false,
    companyName: '',
    cnpj: '',
    cpf: '',
    companyDescription: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Função para obter URL de redirecionamento
  const getRedirectUrl = () => {
    const redirectParam = searchParams.get('redirect');
    console.log('🔄 Parâmetro de redirecionamento:', redirectParam);
    
    if (redirectParam) {
      try {
        const decodedUrl = decodeURIComponent(redirectParam);
        console.log('🔄 URL decodificada:', decodedUrl);
        return decodedUrl;
      } catch (error) {
        console.error('Erro ao decodificar URL de redirecionamento:', error);
      }
    }
    
    // URL padrão após login
    return '/painel-anunciante';
  };
  
  // Certifique-se de que qualquer sessão anterior seja limpa ao abrir o formulário
  useEffect(() => {
    const clearPreviousAuth = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error("Erro ao limpar sessão anterior:", error);
      }
    };
    
    clearPreviousAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
    
    // Limpar erro do campo quando o usuário começa a digitar novamente
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const formatPhone = (value: string) => {
    if (!value) return value;
    
    // Remove todos os caracteres não numéricos
    const phone = value.replace(/\D/g, '');
    
    // Aplica a máscara (99) 99999-9999
    if (phone.length <= 2) {
      return `(${phone}`;
    }
    if (phone.length <= 7) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
    }
    if (phone.length <= 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    setFormData({
      ...formData,
      phone: formattedPhone
    });
  };
  
  const formatCNPJ = (value: string) => {
    if (!value) return value;
    
    // Remove todos os caracteres não numéricos
    const cnpj = value.replace(/\D/g, '');
    
    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    if (cnpj.length <= 2) {
      return cnpj;
    }
    if (cnpj.length <= 5) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    }
    if (cnpj.length <= 8) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    }
    if (cnpj.length <= 12) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    }
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  };
  
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCNPJ = formatCNPJ(e.target.value);
    setFormData({
      ...formData,
      cnpj: formattedCNPJ
    });
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    if (!value) return value;
    
    // Remove todos os caracteres não numéricos
    const cpf = value.replace(/\D/g, '');
    
    // Aplica a máscara XXX.XXX.XXX-XX
    if (cpf.length <= 3) {
      return cpf;
    }
    if (cpf.length <= 6) {
      return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    }
    if (cpf.length <= 9) {
      return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    }
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
  };
  
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setFormData({
      ...formData,
      cpf: formattedCPF
    });
  };

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validação para cada etapa do registro
  const validateAccountType = () => {
    // Não há validação específica para a escolha do tipo de conta
    return true;
  };
  
  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    // CPF obrigatório para pessoas físicas
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else {
      // Validar CPF (formato básico)
      const cpfNumbers = formData.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateCompanyInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório';
    }
    
    // CNPJ obrigatório para empresas
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else {
      // Validar CNPJ (formato básico)
      const cnpjNumbers = formData.cnpj.replace(/\D/g, '');
      if (cnpjNumbers.length !== 14) {
        newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
      }
    }
    
    // CPF do responsável é obrigatório mesmo para empresas
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF do responsável é obrigatório';
    } else {
      const cpfNumbers = formData.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateContactInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do responsável é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (formData.phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato: (99) 99999-9999';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    if (!formData.terms) {
      newErrors.terms = 'Você deve aceitar os termos de uso';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (registerStep === 'account-type' && validateAccountType()) {
      if (accountType === 'personal') {
        setRegisterStep('personal-info');
      } else {
        setRegisterStep('company-info');
      }
    } else if (registerStep === 'personal-info' && validatePersonalInfo()) {
      setRegisterStep('password');
    } else if (registerStep === 'company-info' && validateCompanyInfo()) {
      setRegisterStep('contact-info');
    } else if (registerStep === 'contact-info' && validateContactInfo()) {
      setRegisterStep('password');
    }
  };
  
  const prevStep = () => {
    if (registerStep === 'personal-info') {
      setRegisterStep('account-type');
    } else if (registerStep === 'company-info') {
      setRegisterStep('account-type');
    } else if (registerStep === 'contact-info') {
      setRegisterStep('company-info');
    } else if (registerStep === 'password') {
      if (accountType === 'personal') {
        setRegisterStep('personal-info');
      } else {
      setRegisterStep('contact-info');
      }
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Usar o novo sistema centralizado de autenticação
      const { login } = await import('../lib/authSync');
      
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na autenticação');
      }
      
      if (result.user) {
        console.log('✅ Login centralizado bem-sucedido!', result.user);
        
        setSuccessMessage('Login realizado com sucesso! Redirecionando...');
        
        // Obter URL de redirecionamento
        const redirectUrl = getRedirectUrl();
        console.log('🎯 Redirecionando para:', redirectUrl);
        
        // Redirecionar para a página apropriada com delay maior para garantir sincronização
        setTimeout(() => {
          window.location.assign(redirectUrl);
        }, 1000);
      } else {
        throw new Error('Dados do usuário não encontrados');
      }
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      setErrors({
        form: error.message || 'Erro ao fazer login. Verifique seus dados e tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordInfo()) {
      return;
    }
    
    // IMPORTANTE: Verificar se está tentando registrar com o email "contatotrapstore@gmail.com"
    if (formData.email.toLowerCase() === 'contatotrapstore@gmail.com') {
      setErrors({
        email: 'Este email é reservado e não pode ser utilizado para cadastro. Por favor, use outro email.'
      });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    // Limpar completamente qualquer dado de autenticação anterior
    if (typeof localStorage !== 'undefined') {
      // Remover todos os itens relacionados à autenticação do localStorage
      const keysToRemove = [
        'isLoggedIn', 'userEmail', 'userName', 'userId', 'userAuthStatus',
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token',
        'userProfile', 'hasUserProfile', 'userAvatar', 'userPhone',
        'userWhatsapp', 'userCompany', 'userAddress', 'userCity',
        'userState', 'userZipCode', 'userWebsite', 'userBio'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpar cookies relacionados à autenticação
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    // Tentar no máximo 2 vezes (1 tentativa original + 1 retry)
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Adicionar um pequeno atraso entre tentativas
        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`Tentativa ${attempts} para cadastro`);
        }
        
        console.log('Iniciando cadastro para:', formData.email);
        
        // Criar uma promise com timeout para o registro
        const registrationPromise = directRegister(
          formData.email,
          formData.password,
          formData.name,
          accountType
        );
        
        // Criar um timeout de 20 segundos
        const timeoutPromise = new Promise<any>((_, reject) => {
          setTimeout(() => {
            reject(new Error('O tempo limite para o cadastro foi excedido. O servidor pode estar sobrecarregado. Tente novamente mais tarde.'));
          }, 20000);
        });
        
        // Usar Promise.race para limitar o tempo de espera
        const result = await Promise.race([registrationPromise, timeoutPromise]);
        
        // Se o cadastro foi bem-sucedido
        if (result.success) {
          console.log('Cadastro realizado com sucesso!');
          
          // Verificar se temos dados do usuário
          if (result.user && result.user.id) {
            console.log('Usuário cadastrado com ID:', result.user.id);
            
            // Definir informações de login no localStorage
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('userEmail', formData.email);
              localStorage.setItem('userName', formData.name);
              localStorage.setItem('userId', result.user.id);
              
              // Salvar dados específicos do tipo de conta
              if (accountType === 'personal') {
                localStorage.setItem('userCpf', formData.cpf.replace(/\D/g, ''));
                localStorage.setItem('accountType', 'personal');
              } else {
                localStorage.setItem('userCnpj', formData.cnpj.replace(/\D/g, ''));
                localStorage.setItem('userCpf', formData.cpf.replace(/\D/g, '')); // CPF do responsável
                localStorage.setItem('companyName', formData.companyName);
                localStorage.setItem('accountType', 'business');
              }
              
              // Salvar telefone se fornecido
              if (formData.phone) {
                localStorage.setItem('userPhone', formData.phone);
              }
              
              // Salvar token de acesso se disponível
              if (result.session?.access_token) {
                console.log('Salvando token de acesso');
                localStorage.setItem('sb-access-token', result.session.access_token);
                
                // Definir cookies
                document.cookie = `sb-access-token=${result.session.access_token}; path=/; max-age=2592000; SameSite=Lax`;
                document.cookie = `user_logged_in=true; path=/; max-age=2592000; SameSite=Lax`;
              }
            }
            
            // Exibir mensagem de sucesso
            setSuccessMessage('Conta criada com sucesso! Você será redirecionado em instantes...');
            
            // Obter URL de redirecionamento (para registro, usar planos do painel como padrão)
            const redirectParam = searchParams.get('redirect');
            const redirectUrl = redirectParam ? decodeURIComponent(redirectParam) : '/painel-anunciante/planos';
            console.log('🎯 Redirecionando usuário registrado para:', redirectUrl);
            
            // Redirecionar para a página apropriada com delay maior para garantir sincronização
            setTimeout(() => {
              window.location.assign(redirectUrl);
            }, 2000);
            
            return;
          }
        } else {
          console.error('Falha no registro:', result.error);
          
          // Verificar se é um erro de banco de dados que justifica um retry
          if (attempts < maxAttempts && (
              result.error.includes('database') || 
              result.error.includes('Database') || 
              result.error.includes('checking email')
             )) {
            console.log('Erro de banco de dados, tentando novamente...');
            continue; // Tenta novamente
          }
          
          // Tratar erro de email já existente
          if (result.error.includes('email já está em uso') || 
              result.error.includes('already') || 
              result.error.includes('exists') ||
              result.error.includes('duplicate')) {
            setErrors({
              email: 'Este email já está em uso. Por favor, use outro email ou faça login.'
            });
            setIsLoading(false);
            return;
          }
          
          // Outros erros específicos
          if (result.error.includes('temporariamente indisponível') || 
              result.error.includes('mais tarde') ||
              result.error.includes('tempo limite')) {
            throw new Error('O servidor está temporariamente indisponível. Por favor, tente novamente em alguns minutos.');
          }
          
          // Erro genérico
          throw new Error(result.error || 'Ocorreu um erro durante o cadastro. Por favor, tente novamente.');
        }
      } catch (error: any) {
        console.error('Erro no registro:', error);
        
        // Se não é a última tentativa e é um erro de rede ou timeout
        if (attempts < maxAttempts && (
            error.message.includes('rede') ||
            error.message.includes('conexão') ||
            error.message.includes('tempo limite') ||
            error.message.includes('timeout') ||
            error.message.includes('indisponível')
           )) {
          console.log('Erro de conexão/timeout, tentando novamente...');
          continue; // Tenta novamente
        }
        
        // Mensagem de erro específica para o usuário
        if (error.message.includes('email')) {
          setErrors({
            email: error.message
          });
        } else if (error.message.includes('senha') || error.message.includes('password')) {
          setErrors({
            password: error.message
          });
        } else if (error.message.includes('temporariamente') || 
                  error.message.includes('indisponível') || 
                  error.message.includes('mais tarde')) {
          setErrors({
            form: 'O sistema está temporariamente indisponível. Por favor, tente novamente em alguns minutos.'
          });
        } else if (error.message.includes('tempo limite') || error.message.includes('timeout')) {
          setErrors({
            form: 'O servidor está demorando para responder. Por favor, tente novamente mais tarde.'
          });
        } else {
          setErrors({
            form: error.message || 'Erro ao criar conta. Tente novamente em alguns instantes.'
          });
        }
        
        break; // Sai do loop de tentativas
      }
    }
    
    setIsLoading(false);
  };
  
  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setErrors({
          form: result.error
        });
      }
    } catch (error: any) {
      setErrors({
        form: error.message || 'Erro ao conectar com Google. Tente novamente.'
      });
      console.error('Erro no login com Google:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading('facebook');
    try {
      const result = await signInWithFacebook();
      if (!result.success) {
        setErrors({
          form: result.error
        });
      }
    } catch (error: any) {
      setErrors({
        form: error.message || 'Erro ao conectar com Facebook. Tente novamente.'
      });
      console.error('Erro no login com Facebook:', error);
    } finally {
      setSocialLoading(null);
    }
  };
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setRegisterStep('account-type');
    setErrors({});
    setSuccessMessage('');
  };
  
  // Função para renderizar a etapa atual do formulário de registro
  const renderRegisterStep = () => {
    switch (registerStep) {
      case 'account-type':
        return (
          <>
            <div className="mb-6 text-center">
              <h3 className="text-lg font-medium text-white mb-4">Escolha o tipo de conta</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setAccountType('personal')}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    accountType === 'personal' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <FaUser className="h-12 w-12 text-white mb-3" />
                    <h4 className="font-medium text-white">Pessoa Física</h4>
                    <p className="text-xs text-gray-400 mt-2">Para uso pessoal</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => setAccountType('business')}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    accountType === 'business' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <FaBuilding className="h-12 w-12 text-white mb-3" />
                    <h4 className="font-medium text-white">Pessoa Jurídica</h4>
                    <p className="text-xs text-gray-400 mt-2">Para empresas</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="button"
                onClick={nextStep}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Próximo
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </>
        );
        
      case 'personal-info':
        return (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-white" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="Nome completo"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-white" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-white">
                CPF <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-white" />
                </div>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.cpf ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="000.000.000-00"
                />
              </div>
              {errors.cpf && <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white">
                Telefone
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-white" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="(99) 99999-9999"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Próximo
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </>
        );

      case 'company-info':
        return (
          <>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-white">
                Nome da Empresa <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="h-5 w-5 text-white" />
                </div>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.companyName ? 'border-red-500' : 'border-gray-600'
                  } rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="Nome da sua empresa"
                />
              </div>
              {errors.companyName && <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>}
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-white">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBriefcase className="h-5 w-5 text-white" />
                </div>
                <input
                  type="text"
                  name="cnpj"
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={handleCNPJChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.cnpj ? 'border-red-500' : 'border-gray-600'
                  } rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              {errors.cnpj && <p className="mt-1 text-sm text-red-500">{errors.cnpj}</p>}
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-white">
                CPF <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-white" />
                </div>
                <input
                  type="text"
                  name="cpf"
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.cpf ? 'border-red-500' : 'border-gray-600'
                  } rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="000.000.000-00"
                />
              </div>
              {errors.cpf && <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>}
            </div>

            <div>
              <label htmlFor="companyDescription" className="block text-sm font-medium text-white">
                Descrição da Empresa
              </label>
              <div className="mt-1">
                <textarea
                  id="companyDescription"
                  name="companyDescription"
                  rows={3}
                  value={formData.companyDescription}
                  onChange={handleChange}
                  className="bg-gray-800 block w-full py-3 px-4 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Descreva sua empresa brevemente"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Próximo
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </>
        );
        
      case 'contact-info':
        return (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">
                Nome do Responsável <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-white" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="Nome do responsável"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-white" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white">
                Telefone
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-white" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`bg-gray-800 block w-full pl-10 pr-3 py-3 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="(99) 99999-9999"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Próximo
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </>
        );
        
      case 'password':
        return (
          <>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-white" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-white" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`bg-gray-800 block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                  } rounded-md placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded"
              />
              <label htmlFor="terms" className={`ml-2 block text-sm ${errors.terms ? 'text-red-500' : 'text-gray-400'}`}>
                Concordo com os <a href="/termos" className="text-primary hover:text-primary-light">Termos de Uso</a> e <a href="/privacidade" className="text-primary hover:text-primary-light">Política de Privacidade</a>
              </label>
            </div>
            {errors.terms && <p className="mt-1 text-sm text-red-500">{errors.terms}</p>}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Processando...' : 'Criar conta'}
              </button>
            </div>
          </>
        );
    }
  };
  
  return (
    <div className="bg-black py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
      <div className="flex flex-col items-center justify-center w-full mb-6 mt-2">
        <div className="relative w-60 h-32 mb-2">
        <Image 
          src="/images/logo.png" 
            alt="BuscaAquiBdC"
            fill
            style={{ objectFit: 'contain' }}
          priority
        />
        </div>
      </div>
      
      <h2 className="mb-6 text-center text-2xl font-bold text-white">
        {mode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
      </h2>
      
      {mode === 'login' ? (
        <p className="mb-6 text-center text-sm text-gray-400">
          Não tem uma conta?{' '}
          <button 
            onClick={toggleMode} 
            className="font-medium text-primary hover:text-primary-light"
          >
            Cadastre-se agora
          </button>
        </p>
      ) : (
        <p className="mb-6 text-center text-sm text-gray-400">
          Já tem uma conta?{' '}
          <button 
            onClick={toggleMode} 
            className="font-medium text-primary hover:text-primary-light"
          >
            Faça login
          </button>
        </p>
      )}
      
      {/* Indicador de etapas para o registro */}
      {mode === 'register' && (
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              registerStep === 'account-type' 
                ? 'bg-primary text-black' 
                : (registerStep === 'personal-info' || registerStep === 'company-info' || registerStep === 'contact-info' || registerStep === 'password')
                ? 'bg-green-700 text-white' 
                : 'bg-gray-700 text-white'
            }`}>
              1
            </div>
            <span className="text-xs mt-1 text-gray-400">Tipo</span>
          </div>
          
          <div className={`h-1 flex-1 mx-2 ${
            (registerStep === 'personal-info' || registerStep === 'company-info' || registerStep === 'contact-info' || registerStep === 'password')
              ? 'bg-green-700' 
              : 'bg-gray-700'
          }`}></div>
          
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              (registerStep === 'personal-info' || registerStep === 'company-info')
                ? 'bg-primary text-black' 
                : (registerStep === 'contact-info' || registerStep === 'password')
                ? 'bg-green-700 text-white' 
                : 'bg-gray-700 text-white'
            }`}>
              2
            </div>
            <span className="text-xs mt-1 text-gray-400">Dados</span>
          </div>
          
          <div className={`h-1 flex-1 mx-2 ${
            (accountType === 'business' && (registerStep === 'contact-info' || registerStep === 'password'))
              ? 'bg-green-700' 
              : 'bg-gray-700'
          }`}></div>
          
          {accountType === 'business' && (
            <>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              registerStep === 'contact-info' 
                ? 'bg-primary text-black' 
                : registerStep === 'password'
                ? 'bg-green-700 text-white' 
                : 'bg-gray-700 text-white'
            }`}>
                  3
            </div>
            <span className="text-xs mt-1 text-gray-400">Contato</span>
          </div>
          
          <div className={`h-1 flex-1 mx-2 ${
            registerStep === 'password' 
              ? 'bg-green-700' 
              : 'bg-gray-700'
          }`}></div>
            </>
          )}
          
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              registerStep === 'password' 
                ? 'bg-primary text-black' 
                : 'bg-gray-700 text-white'
            }`}>
              {accountType === 'business' ? '4' : '3'}
            </div>
            <span className="text-xs mt-1 text-gray-400">Senha</span>
          </div>
        </div>
      )}
      
      {errors.form && (
        <div className="mb-6 bg-red-900/50 border border-red-500 rounded-md p-3 text-sm text-white">
          {errors.form}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-900/50 border border-green-500 rounded-md p-3 text-sm text-white">
          {successMessage}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
        {/* Formulário de Login */}
        {mode === 'login' ? (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-gray-900 border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded-md py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-gray-900 border ${errors.password ? 'border-red-500' : 'border-gray-700'} rounded-md py-3 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-400">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <Link href="/esqueci-senha" className="font-medium text-green-500 hover:text-green-400">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Processando...' : 'Entrar'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-gray-400 text-sm">
                Ou entre com
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || socialLoading !== null}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-900 text-sm font-medium text-gray-300 hover:bg-gray-800"
              >
                <FaGoogle className="w-5 h-5 mr-2 text-red-500" />
                {socialLoading === 'google' ? 'Processando...' : 'Google'}
              </button>
              <button
                type="button"
                onClick={handleFacebookSignIn}
                disabled={isLoading || socialLoading !== null}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-900 text-sm font-medium text-gray-300 hover:bg-gray-800"
              >
                <FaFacebook className="w-5 h-5 mr-2 text-blue-600" />
                {socialLoading === 'facebook' ? 'Processando...' : 'Facebook'}
              </button>
            </div>
          </>
        ) : (
          // Formulário de registro por etapas
          renderRegisterStep()
        )}
      </form>
    </div>
  );
};

export default AuthForm; 