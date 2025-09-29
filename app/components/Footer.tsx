"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white border-t border-gray-800" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16" suppressHydrationWarning>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12" suppressHydrationWarning>
          <div className="lg:col-span-1" suppressHydrationWarning>
            <Link href="/" className="flex items-center mb-10 py-3">
              <div className="relative w-48 h-32 mx-2" suppressHydrationWarning>
                <Image
                  src="/images/logo.png"
                  alt="BuscaAquiBdC"
                  fill
                  sizes="192px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </Link>
            <p className="text-white text-sm leading-relaxed mb-6">
              A melhor plataforma de classificados online. Encontre e anuncie produtos e serviços na sua região.
            </p>
            <div className="mt-8 flex space-x-5" suppressHydrationWarning>
              <a href="#" className="text-white hover:text-green-500 transition-colors duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-green-500 transition-colors duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-green-500 transition-colors duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-1" suppressHydrationWarning>
            <h3 className="text-xl font-semibold mb-6 border-b border-gray-800 pb-3 text-white">Categorias</h3>
            <ul className="space-y-4">
              <li><Link href="/categoria/carros" className="text-white hover:text-green-500 transition-colors duration-300">Carros</Link></li>
              <li><Link href="/categoria/imoveis" className="text-white hover:text-green-500 transition-colors duration-300">Imóveis</Link></li>
              <li><Link href="/categoria/eletronicos" className="text-white hover:text-green-500 transition-colors duration-300">Eletrônicos</Link></li>
              <li><Link href="/categoria/moveis" className="text-white hover:text-green-500 transition-colors duration-300">Móveis</Link></li>
              <li><Link href="/categoria/servicos" className="text-white hover:text-green-500 transition-colors duration-300">Serviços</Link></li>
              <li><Link href="/categoria/empregos" className="text-white hover:text-green-500 transition-colors duration-300">Empregos</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-1" suppressHydrationWarning>
            <h3 className="text-xl font-semibold mb-6 border-b border-gray-800 pb-3 text-white">Planos</h3>
            <ul className="space-y-4">
              <li><Link href="/planos" className="text-white hover:text-green-500 transition-colors duration-300">Gratuito</Link></li>
              <li><Link href="/planos" className="text-white hover:text-green-500 transition-colors duration-300">Microempresa</Link></li>
              <li><Link href="/planos" className="text-white hover:text-green-500 transition-colors duration-300">Pequena Empresa</Link></li>
              <li><Link href="/planos" className="text-white hover:text-green-500 transition-colors duration-300">Empresa</Link></li>
              <li><Link href="/planos" className="text-white hover:text-green-500 transition-colors duration-300">Empresa Plus</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-1" suppressHydrationWarning>
            <h3 className="text-xl font-semibold mb-6 border-b border-gray-800 pb-3 text-white">Suporte</h3>
            <ul className="space-y-4">
              <li><Link href="/como-funciona" className="text-white hover:text-green-500 transition-colors duration-300">Como funciona</Link></li>
              <li><Link href="/dicas-anuncios" className="text-white hover:text-green-500 transition-colors duration-300">Dicas para anúncios</Link></li>
              <li><Link href="/termos-uso" className="text-white hover:text-green-500 transition-colors duration-300">Termos de uso</Link></li>
              <li><Link href="/politica-privacidade" className="text-white hover:text-green-500 transition-colors duration-300">Política de privacidade</Link></li>
              <li><Link href="/contato" className="text-white hover:text-green-500 transition-colors duration-300">Contato</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-800" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8" suppressHydrationWarning>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6" suppressHydrationWarning>
            <p className="text-white text-sm">
              &copy; {new Date().getFullYear()} BDC Classificados. Todos os direitos reservados.
            </p>
            
            <div className="flex items-center gap-4" suppressHydrationWarning>
              <span className="text-white text-sm hidden md:inline">Baixe nosso app:</span>
              <div className="flex space-x-4" suppressHydrationWarning>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white hover:text-white rounded-md transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 512 512">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.6 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                  </svg>
                  <span className="text-sm text-white">Google Play</span>
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white hover:text-white rounded-md transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.665,16.811c-0.287,0.664-0.627,1.275-1.021,1.837c-0.537,0.767-0.978,1.297-1.316,1.592 c-0.525,0.482-1.089,0.73-1.692,0.744c-0.432,0-0.954-0.123-1.562-0.373c-0.61-0.249-1.17-0.371-1.683-0.371 c-0.537,0-1.113,0.122-1.73,0.371c-0.616,0.25-1.114,0.381-1.495,0.393c-0.577,0.025-1.154-0.229-1.729-0.764 c-0.367-0.32-0.826-0.87-1.377-1.648c-0.59-0.829-1.075-1.794-1.455-2.891c-0.407-1.187-0.611-2.335-0.611-3.447 c0-1.273,0.275-2.372,0.826-3.292c0.434-0.74,1.01-1.323,1.73-1.751C7.271,6.782,8.051,6.563,8.89,6.549 c0.46,0,1.063,0.142,1.81,0.422s1.227,0.422,1.436,0.422c0.158,0,0.689-0.167,1.593-0.498c0.853-0.307,1.573-0.434,2.163-0.384 c1.6,0.129,2.801,0.759,3.6,1.895c-1.43,0.867-2.137,2.08-2.123,3.637c0.012,1.213,0.453,2.222,1.317,3.023 c0.392,0.372,0.829,0.659,1.315,0.863C19.895,16.236,19.783,16.529,19.665,16.811L19.665,16.811z M15.998,2.38 c0,0.95-0.348,1.838-1.039,2.659c-0.836,0.976-1.846,1.541-2.941,1.452c-0.014-0.114-0.021-0.234-0.021-0.36 c0-0.913,0.396-1.889,1.103-2.688c0.352-0.404,0.8-0.741,1.343-1.009c0.542-0.264,1.054-0.41,1.536-0.435 C15.992,2.127,15.998,2.254,15.998,2.38L15.998,2.38z"></path>
                  </svg>
                  <span className="text-sm text-white">App Store</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 