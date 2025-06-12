'use client'

import React, { useEffect, useState, createContext, useContext } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { setupDatabase } from '@/lib/dbSetup'
import { supabase, initializeStorage, checkAndRefreshSession } from '@/lib/supabase'
import { initializeSupabaseServices } from '@/lib/initSupabase'

interface SupabaseContextType {
  supabase: SupabaseClient
  initialized: boolean
  isOffline: boolean
  isAuthenticated: boolean
  userId: string | null
  checkSession: () => Promise<boolean>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [initialized, setInitialized] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Função para verificar a sessão atual do usuário
  const checkSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao verificar sessão:', error)
        setIsAuthenticated(false)
        setUserId(null)
        return false
      }
      
      const hasValidSession = !!data.session
      setIsAuthenticated(hasValidSession)
      
      if (hasValidSession && data.session) {
        const uid = data.session.user.id
        setUserId(uid)
        
        // Atualizar no localStorage para compatibilidade
        localStorage.setItem('userId', uid)
        localStorage.setItem('userEmail', data.session.user.email || '')
        localStorage.setItem('isLoggedIn', 'true')
        
        // Verificar e renovar o token se necessário
        await checkAndRefreshSession(supabase)
      } else {
        setUserId(null)
      }
      
      return hasValidSession
    } catch (e) {
      console.error('Erro ao verificar autenticação:', e)
      setIsAuthenticated(false)
      setUserId(null)
      return false
    }
  }

  useEffect(() => {
    // Função para inicializar todos os serviços do Supabase
    const initialize = async () => {
      try {
        console.log('Iniciando serviços do Supabase...')
        
        // Garantir que o cliente já foi inicializado na importação
        if (!supabase) {
          console.error('Cliente Supabase não inicializado')
          setIsOffline(true)
          setInitialized(true)
          return
        }
        
        // Verificar sessão inicial
        await checkSession()
        
        // Configurar ouvintes para eventos de autenticação
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Evento de auth:', event, session ? 'Com sessão' : 'Sem sessão')
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session) {
              setIsAuthenticated(true)
              setUserId(session.user.id)
              
              // Atualizar localStorage para compatibilidade
              localStorage.setItem('userId', session.user.id)
              localStorage.setItem('userEmail', session.user.email || '')
              localStorage.setItem('isLoggedIn', 'true')
            }
          } else if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false)
            setUserId(null)
            
            // Limpar localStorage
            localStorage.removeItem('userId')
            localStorage.removeItem('userEmail')
            localStorage.removeItem('isLoggedIn')
          }
        })

        // Inicializar storage - continuar mesmo se falhar
        try {
        await initializeStorage()
        } catch (storageError) {
          console.warn('Erro ao inicializar storage, continuando em modo offline:', storageError)
        }
        
        // Inicializar serviços adicionais - continuar mesmo se falhar
        try {
        await initializeSupabaseServices()
        } catch (servicesError) {
          console.warn('Erro ao inicializar serviços, continuando em modo offline:', servicesError)
        }
        
        // Configurar banco de dados - continuar mesmo se falhar
        try {
        await setupDatabase()
        } catch (dbError) {
          console.warn('Erro ao configurar banco de dados, continuando em modo offline:', dbError)
          setIsOffline(true)
        }
        
        // Configurar verificação periódica de sessão a cada 5 minutos
        const sessionCheckInterval = setInterval(async () => {
          if (isAuthenticated) {
            await checkAndRefreshSession(supabase)
          }
        }, 5 * 60 * 1000)
        
        // Marcar como inicializado em qualquer cenário
        setInitialized(true)
        
        // Limpar ouvintes e intervalos quando o componente for desmontado
        return () => {
          authListener?.subscription.unsubscribe()
          clearInterval(sessionCheckInterval)
        }
      } catch (error) {
        console.error('Erro ao inicializar serviços do Supabase:', error)
        setIsOffline(true)
        setInitialized(true) // Marcar como inicializado mesmo com erro
      }
    }

    // Inicializar
    initialize()
  }, [])

  return (
    <SupabaseContext.Provider 
      value={{ 
        supabase, 
        initialized, 
        isOffline, 
        isAuthenticated, 
        userId, 
        checkSession 
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
} 