import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    profile: null as any
  }),

  actions: {
  async fetchUser() {
  const { data } = await supabase.auth.getUser()
  this.user = data.user

  if (!this.user) {
    this.profile = null
    return
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', this.user.id)
    .single()

  if (error) throw error

  this.profile = profile
},

async login(email: string, password: string) {
  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    })

  if (error) throw error

  await this.fetchUser()

  // ✅ APPROVAL CHECK
  if (!this.profile) {
    await supabase.auth.signOut()
    throw new Error("Profile not found.")
  }

  if (this.profile.status !== 'approved') {
    await supabase.auth.signOut()
    this.user = null
    this.profile = null

    throw new Error("Your account is not approved yet.")
  }
},

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    }
  }
})