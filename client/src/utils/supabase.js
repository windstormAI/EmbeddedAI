import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database helper functions
export const db = {
  // User profiles
  profiles: {
    async get(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },

    async update(userId, updates) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Subscriptions
  subscriptions: {
    async get(userId) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    },

    async create(subscriptionData) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(userId, updates) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Projects
  projects: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async get(projectId) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },

    async create(projectData) {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(projectId, updates) {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(projectId) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
    }
  },

  // Components
  components: {
    async getAll() {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },

    async getByCategory(category) {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .eq('category', category)
        .order('name');
      if (error) throw error;
      return data;
    }
  },

  // AI Interactions
  aiInteractions: {
    async create(interactionData) {
      const { data, error } = await supabase
        .from('ai_interactions')
        .insert(interactionData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getUserInteractions(userId, limit = 50) {
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    }
  },

  // Usage tracking
  usage: {
    async track(userId, feature, metadata = {}) {
      const { data, error } = await supabase
        .from('usage_stats')
        .upsert({
          user_id: userId,
          feature,
          metadata,
          created_at: new Date().toISOString().split('T')[0] // Date only for uniqueness
        }, {
          onConflict: 'user_id,feature,DATE(created_at)'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getUserUsage(userId, startDate, endDate) {
      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at');
      if (error) throw error;
      return data;
    }
  },

  // Templates
  templates: {
    async getAll() {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getByCategory(category) {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getFeatured() {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  }
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to project changes
  subscribeToProject(projectId, callback) {
    return supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to user profile changes
  subscribeToProfile(userId, callback) {
    return supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to subscription changes
  subscribeToSubscription(userId, callback) {
    return supabase
      .channel(`subscription-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
};

export default supabase;