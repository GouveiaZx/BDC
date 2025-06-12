"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FaQuestionCircle, FaArrowLeft, FaSearch, 
  FaChevronDown, FaChevronUp, FaTag, FaMoneyBill,
  FaUserAlt, FaShieldAlt, FaCreditCard, FaAd
} from 'react-icons/fa';

// Definição de tipos
interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: string;
}

// Categorias de FAQs
type FAQCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Categorias de perguntas
  const categories: FAQCategory[] = [
    { id: 'all', name: 'Todas as perguntas', icon: <FaQuestionCircle /> },
    { id: 'account', name: 'Conta e cadastro', icon: <FaUserAlt /> },
    { id: 'ads', name: 'Anúncios', icon: <FaAd /> },
    { id: 'payment', name: 'Pagamentos', icon: <FaCreditCard /> },
    { id: 'pricing', name: 'Planos e preços', icon: <FaMoneyBill /> },
    { id: 'security', name: 'Segurança', icon: <FaShieldAlt /> },
  ];

  // Dados das FAQs
  const faqs: FAQItem[] = [
    // Conta e cadastro
    {
      id: 'register',
      question: 'Como faço para me cadastrar no BDC Classificados?',
      answer: (
        <div>
          <p>Para se cadastrar, clique no botão "Cadastrar" no topo da página e siga os passos:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Preencha seus dados pessoais</li>
            <li>Confirme seu e-mail clicando no link que enviaremos</li>
            <li>Complete seu perfil com informações adicionais para melhorar sua experiência</li>
          </ol>
          <p className="mt-2">O cadastro é gratuito e leva menos de 5 minutos.</p>
        </div>
      ),
      category: 'account'
    },
    {
      id: 'login-issues',
      question: 'Esqueci minha senha. Como recuperá-la?',
      answer: (
        <div>
          <p>Se você esqueceu sua senha, siga estes passos:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Clique em "Entrar" no topo da página</li>
            <li>Selecione a opção "Esqueci minha senha"</li>
            <li>Digite o e-mail cadastrado</li>
            <li>Você receberá um link para redefinir sua senha</li>
          </ol>
          <p className="mt-2">O link expira em 24 horas por motivos de segurança.</p>
        </div>
      ),
      category: 'account'
    },
    {
      id: 'account-delete',
      question: 'Como posso excluir minha conta?',
      answer: (
        <div>
          <p>Para excluir sua conta:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Acesse "Meu Painel" no menu superior</li>
            <li>Vá até "Editar Perfil"</li>
            <li>Role até o final da página e clique em "Excluir conta"</li>
            <li>Confirme a exclusão digitando sua senha</li>
          </ol>
          <p className="mt-2 text-yellow-600">Atenção: Essa ação é irreversível. Todos os seus anúncios e dados serão removidos permanentemente.</p>
        </div>
      ),
      category: 'account'
    },
    
    // Anúncios
    {
      id: 'create-ad',
      question: 'Como faço para criar um anúncio?',
      answer: (
        <div>
          <p>Para criar um anúncio:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Faça login em sua conta</li>
            <li>Clique em "Criar Anúncio" no menu superior ou no seu painel</li>
            <li>Selecione a categoria e subcategoria adequadas</li>
            <li>Preencha todos os campos do formulário com informações detalhadas</li>
            <li>Adicione fotos de qualidade (recomendamos pelo menos 3 fotos)</li>
            <li>Revise e publique</li>
          </ol>
          <p className="mt-2">
            Para dicas detalhadas sobre como criar anúncios eficientes, 
            <Link href="/ajuda/como-anunciar" className="text-blue-600 hover:text-blue-800 ml-1">
              clique aqui
            </Link>.
          </p>
        </div>
      ),
      category: 'ads'
    },
    {
      id: 'ad-approval',
      question: 'Quanto tempo leva para meu anúncio ser aprovado?',
      answer: 
        <p>
          A maioria dos anúncios é aprovada automaticamente assim que publicada. Em alguns casos, pode haver uma 
          revisão manual que leva até 24 horas úteis. Anúncios que violem nossas políticas podem ser rejeitados. 
          Você receberá uma notificação quando seu anúncio for aprovado ou caso haja algum problema.
        </p>,
      category: 'ads'
    },
    {
      id: 'ad-edit',
      question: 'Posso editar meu anúncio depois de publicado?',
      answer: 
        <div>
          <p>
            Sim, você pode editar a maioria das informações do seu anúncio após a publicação. Para isso:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Acesse "Meu Painel" no menu superior</li>
            <li>Vá até "Meus Anúncios"</li>
            <li>Encontre o anúncio que deseja editar e clique no botão "Editar"</li>
          </ol>
          <p className="mt-2">
            Note que alterações significativas podem fazer com que seu anúncio passe por uma nova revisão.
            Alguns campos como categoria e subcategoria não podem ser alterados - neste caso, você precisará
            criar um novo anúncio.
          </p>
        </div>,
      category: 'ads'
    },
    {
      id: 'ad-photos',
      question: 'Quantas fotos posso adicionar ao meu anúncio?',
      answer: 
        <p>
          No plano gratuito, você pode adicionar até 5 fotos por anúncio. Nos planos pagos, esse limite varia de 10 a 20 fotos, 
          dependendo do plano escolhido. Cada foto deve ter no máximo 5MB, e recomendamos imagens com resolução mínima de 800x600 pixels 
          para melhor visualização. Para dicas sobre como tirar boas fotos para seus anúncios, 
          <Link href="/ajuda/dicas-fotos" className="text-blue-600 hover:text-blue-800 ml-1">
            clique aqui
          </Link>.
        </p>,
      category: 'ads'
    },
    {
      id: 'ad-duration',
      question: 'Por quanto tempo meu anúncio fica disponível?',
      answer: 
        <p>
          A duração dos anúncios varia conforme o plano:
        </p>,
      category: 'ads'
    },
    {
      id: 'ad-views',
      question: 'Como posso ver quantas pessoas visualizaram meu anúncio?',
      answer: 
        <div>
          <p>
            Todos os usuários têm acesso a estatísticas básicas de visualizações. Para acessá-las:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Acesse "Meu Painel" no menu superior</li>
            <li>Vá até "Meus Anúncios"</li>
            <li>Clique em "Estatísticas" ao lado do anúncio desejado</li>
          </ol>
          <p className="mt-2">
            Usuários com planos pagos têm acesso a estatísticas avançadas, incluindo dados demográficos,
            tempo médio de visualização e origem do tráfego.
          </p>
        </div>,
      category: 'ads'
    },
    
    // Pagamentos
    {
      id: 'payment-methods',
      question: 'Quais formas de pagamento são aceitas?',
      answer: 
        <div>
          <p>Aceitamos as seguintes formas de pagamento para planos e destaques:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Cartões de crédito (Visa, Mastercard, American Express, Elo)</li>
            <li>Boleto bancário (prazo de compensação de até 3 dias úteis)</li>
            <li>PIX (aprovação imediata)</li>
          </ul>
          <p className="mt-2">
            Todos os pagamentos são processados de forma segura através da plataforma Asaas.
          </p>
        </div>,
      category: 'payment'
    },
    {
      id: 'payment-security',
      question: 'O pagamento é seguro?',
      answer: 
        <p>
          Sim, todos os pagamentos são processados através da plataforma Asaas, que utiliza criptografia SSL
          de 256 bits para proteger suas informações. Não armazenamos dados de cartão de crédito em nossos servidores.
          Todas as transações seguem os padrões de segurança PCI DSS.
        </p>,
      category: 'payment'
    },
    {
      id: 'payment-receipt',
      question: 'Como obtenho o comprovante de pagamento?',
      answer: 
        <div>
          <p>
            Após a confirmação do pagamento, o comprovante é enviado automaticamente para o e-mail cadastrado.
            Você também pode acessar todos os seus comprovantes a qualquer momento através do painel:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Acesse "Meu Painel" no menu superior</li>
            <li>Vá até "Gerenciar Assinatura"</li>
            <li>Clique na aba "Histórico de Pagamentos"</li>
            <li>Localize o pagamento desejado e clique em "Ver recibo"</li>
          </ol>
        </div>,
      category: 'payment'
    },
    
    // Planos e preços
    {
      id: 'free-plan',
      question: 'O que está incluído no plano gratuito?',
      answer: 
        <div>
          <p>O plano gratuito inclui:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Até 3 anúncios ativos simultaneamente</li>
            <li>Duração de 30 dias por anúncio</li>
            <li>Até 5 fotos por anúncio</li>
            <li>Estatísticas básicas</li>
            <li>Possibilidade de comprar destaques avulsos</li>
          </ul>
          <p className="mt-2">
            O plano gratuito é ideal para usuários ocasionais ou para testar a plataforma.
          </p>
        </div>,
      category: 'pricing'
    },
    {
      id: 'paid-plans',
      question: 'Quais são os planos pagos disponíveis e seus valores?',
      answer: 
        <div>
          <p>Oferecemos os seguintes planos pagos:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Micro Negócios (R$ 49,90/mês)</strong>: 
              4 anúncios ativos por 60 dias, 10 fotos por anúncio, destaques avulsos por R$ 9,90
            </li>
            <li>
              <strong>Pequenos Negócios (R$ 149,90/mês)</strong>: 
              10 anúncios ativos por 90 dias, 15 fotos por anúncio, 1 destaque/dia incluso
            </li>
            <li>
              <strong>Empresarial (R$ 249,90/mês)</strong>: 
              20 anúncios ativos por 90 dias, 20 fotos por anúncio, 2 destaques/dia inclusos
            </li>
            <li>
              <strong>Empresarial Plus (R$ 399,90/mês)</strong>: 
              Anúncios ilimitados por 120 dias, 20 fotos por anúncio, 5 destaques/dia inclusos
            </li>
          </ul>
          <p className="mt-2">
            Para mais detalhes sobre os planos, 
            <Link href="/planos" className="text-blue-600 hover:text-blue-800 ml-1">
              clique aqui
            </Link>.
          </p>
        </div>,
      category: 'pricing'
    },
    {
      id: 'plan-change',
      question: 'Como posso mudar de plano?',
      answer: 
        <div>
          <p>
            Para mudar de plano:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Acesse "Meu Painel" no menu superior</li>
            <li>Vá até "Gerenciar Assinatura"</li>
            <li>Clique em "Alterar plano"</li>
            <li>Selecione o novo plano desejado</li>
            <li>Confirme a mudança</li>
          </ol>
          <p className="mt-2">
            Se você estiver fazendo upgrade (mudando para um plano superior), a alteração será aplicada imediatamente,
            com valor proporcional. Se estiver fazendo downgrade (mudando para um plano inferior), a alteração será
            aplicada ao final do ciclo atual.
          </p>
        </div>,
      category: 'pricing'
    },
    {
      id: 'plan-cancel',
      question: 'Como cancelar minha assinatura?',
      answer: 
        <div>
          <p>
            Para cancelar sua assinatura:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Acesse "Meu Painel" no menu superior</li>
            <li>Vá até "Gerenciar Assinatura"</li>
            <li>Clique em "Cancelar assinatura"</li>
            <li>Confirme o cancelamento</li>
          </ol>
          <p className="mt-2">
            Após o cancelamento, você continuará com acesso ao plano atual até o final do período já pago.
            Ao término desse período, sua conta será convertida automaticamente para o plano gratuito.
          </p>
        </div>,
      category: 'pricing'
    },
    
    // Segurança
    {
      id: 'security-tips',
      question: 'Como fazer negociações seguras pela plataforma?',
      answer: 
        <div>
          <p>Recomendamos seguir estas dicas de segurança:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Sempre converse inicialmente pela plataforma antes de compartilhar contatos pessoais</li>
            <li>Desconfie de preços muito abaixo do mercado ou condições muito vantajosas</li>
            <li>Nunca faça pagamentos antecipados sem garantias ou para pessoas que não conhece</li>
            <li>Prefira encontros em locais públicos e movimentados para verificar produtos</li>
            <li>No caso de imóveis, sempre verifique a documentação</li>
            <li>Desconfie se o vendedor pressionar por decisão imediata</li>
          </ul>
          <p className="mt-2">
            Lembre-se: o BDC Classificados é uma plataforma de anúncios e não participa das negociações
            entre usuários.
          </p>
        </div>,
      category: 'security'
    },
    {
      id: 'report-ad',
      question: 'Como denunciar um anúncio suspeito?',
      answer: 
        <div>
          <p>
            Se encontrar um anúncio que viole nossas políticas ou pareça fraudulento:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Abra o anúncio em questão</li>
            <li>Role até o final da página</li>
            <li>Clique no link "Denunciar anúncio"</li>
            <li>Selecione o motivo da denúncia</li>
            <li>Forneça detalhes adicionais (opcional)</li>
            <li>Envie a denúncia</li>
          </ol>
          <p className="mt-2">
            Nossa equipe analisará cada denúncia o mais rápido possível e tomará as medidas cabíveis.
          </p>
        </div>,
      category: 'security'
    },
    {
      id: 'data-privacy',
      question: 'Como meus dados pessoais são protegidos?',
      answer: 
        <div>
          <p>
            Levamos a proteção de dados muito a sério e seguimos a Lei Geral de Proteção de Dados (LGPD):
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Seus dados são criptografados e armazenados em servidores seguros</li>
            <li>Não compartilhamos suas informações com terceiros sem seu consentimento</li>
            <li>Você tem direito de acessar, corrigir e solicitar a exclusão dos seus dados</li>
            <li>Utilizamos cookies apenas para melhorar sua experiência na plataforma</li>
          </ul>
          <p className="mt-2">
            Para mais detalhes, consulte nossa 
            <Link href="/politica-privacidade" className="text-blue-600 hover:text-blue-800 ml-1">
              Política de Privacidade
            </Link>.
          </p>
        </div>,
      category: 'security'
    }
  ];

  // Função para alternar a visualização das respostas
  const toggleItem = (id: string) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter(item => item !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };

  // Filtrar FAQs por categoria e termo de busca
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com navegação */}
      <div className="mb-8">
        <Link 
          href="/ajuda" 
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
        >
          <FaArrowLeft className="mr-1" /> Voltar para Central de Ajuda
        </Link>
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <FaQuestionCircle className="mr-2 text-blue-600" /> Perguntas Frequentes
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Encontre respostas para as dúvidas mais comuns sobre o BDC Classificados.
        </p>
      </div>

      {/* Área de pesquisa */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar perguntas frequentes..."
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categorias */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de FAQs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {filteredFaqs.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredFaqs.map((faq) => (
              <li key={faq.id} className="p-0">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full text-left p-6 focus:outline-none"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                    {openItems.includes(faq.id) ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </div>
                </button>
                
                {openItems.includes(faq.id) && (
                  <div className="px-6 pb-6 pt-2 text-gray-700">
                    <div className="border-t border-gray-200 pt-4">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center">
            <FaQuestionCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pergunta encontrada</h3>
            <p className="text-gray-500">
              Não encontramos nenhuma pergunta relacionada à sua busca. Tente termos diferentes ou entre em contato com nosso suporte.
            </p>
          </div>
        )}
      </div>

      {/* CTA de contato */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold mb-3">Não encontrou o que procurava?</h2>
        <p className="text-gray-600 mb-4">
          Entre em contato diretamente com nosso suporte e teremos prazer em ajudar.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="mailto:suporte@bdcclassificados.com.br" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center font-medium transition duration-300"
          >
            Enviar e-mail para suporte
          </a>
          <Link 
            href="/ajuda/contato" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg flex items-center justify-center font-medium transition duration-300"
          >
            Usar formulário de contato
          </Link>
        </div>
      </div>
    </div>
  );
} 