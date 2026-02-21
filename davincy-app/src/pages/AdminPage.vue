<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.ts'

const profiles = ref<any[]>([])
const loading = ref(true)

async function fetchProfiles() {
  loading.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  } else {
    profiles.value = data || []
  }

  loading.value = false
}

async function approveUser(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', id)

  if (!error) {
    fetchProfiles()
  }
}

async function deleteUser(id: string) {
  if (!confirm('Delete this user?')) return

  // we will connect this to serverless function later
  await fetch('/api/delete-user', {
    method: 'POST',
    body: JSON.stringify({ userId: id })
  })

  fetchProfiles()
}

onMounted(fetchProfiles)
</script>

<template>
  <div class="admin">
    <h1>Admin Panel</h1>

    <div v-if="loading">Loading...</div>

    <div
      v-for="profile in profiles"
      :key="profile.id"
      class="profile-card"
    >
      <h3>{{ profile.first_name }} {{ profile.second_name }}</h3>

      <p>Status: {{ profile.status }}</p>
      <p>Country: {{ profile.current_country }}</p>

      <button
        v-if="profile.status === 'pending'"
        @click="approveUser(profile.id)"
      >
        Approve
      </button>

      <button @click="deleteUser(profile.id)">
        Delete
      </button>
    </div>
  </div>
</template>