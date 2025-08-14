
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Profile } from '@/integrations/supabase/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Function to create profile from user data - simplified approach
  const handleUserProfile = async (user: User): Promise<boolean> => {
    try {
      console.log('🔄 Creating profile from user data:', user.id)
      
      // Create a profile object from user data directly
      const profileFromUser: Profile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('✅ Profile created from user data:', profileFromUser)
      setProfile(profileFromUser)
      
      // Async background sync with database (non-blocking)
      setTimeout(() => {
        syncProfileToDatabase(user, profileFromUser)
      }, 100)
      
      return true
    } catch (error) {
      console.error('❌ Error creating profile from user:', error)
      setProfile(null)
      return false
    }
  }
  
  // Background sync function (non-blocking)
  const syncProfileToDatabase = async (user: User, profile: Profile) => {
    try {
      console.log('🔄 Background sync: checking if profile exists in DB')
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!existingProfile) {
        console.log('🔄 Background sync: creating profile in DB')
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || null
          })
        console.log('✅ Background sync: profile created in DB')
      } else {
        console.log('✅ Background sync: profile already exists in DB')
      }
    } catch (error) {
      console.log('⚠️ Background sync failed (non-critical):', error)
    }
  }

  useEffect(() => {
    console.log('🚀 useAuth initializing...')
    let isInitialized = false
    
    const handleSession = async (session: Session | null, source: string) => {
      if (isInitialized) {
        console.log('⏭️ Skipping duplicate session handling from:', source)
        return
      }
      
      console.log('🔄 Handling session from:', source, 'User ID:', session?.user?.id)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('👤 User found, loading profile...')
        const profileLoaded = await handleUserProfile(session.user)
        console.log('✅ Profile loading result:', profileLoaded)
      } else {
        console.log('👤 No user found')
        setProfile(null)
      }
      
      setLoading(false)
      isInitialized = true
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change event:', event)
        if (event !== 'INITIAL_SESSION') {
          isInitialized = false // Allow handling of new auth events
          await handleSession(session, 'onAuthStateChange')
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session, 'getSession')
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar sua conta.",
      })
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      })
    }

    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
